import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_scoped_school_id, require_feature
from app.core.permissions import FeatureCode
from app.db.session import get_db
from app.models.availability import TeacherAvailability
from app.models.school import School
from app.models.timetable import TimetableEntry
from app.schemas.timetable import (
    GenerationConfig,
    TimetableEntryOut,
    TimetableEntryUpdate,
)
from app.services.timetable_generation_service import (
    TimetableGenerationError,
    generate_timetable as run_timetable_generation,
)

router = APIRouter(prefix="/timetable", tags=["timetable"])


# ============================================================
# LIST TIMETABLE ENTRIES
# ============================================================

@router.get("", response_model=list[TimetableEntryOut])
async def list_entries(
    section_id: uuid.UUID | None = None,
    teacher_id: uuid.UUID | None = None,
    school_id: uuid.UUID = Depends(get_scoped_school_id),
    db: AsyncSession = Depends(get_db),
) -> list[TimetableEntry]:
    """
    Return timetable entries for the current school.

    Optional filters:
    - section_id
    - teacher_id
    """

    stmt = select(TimetableEntry).where(
        TimetableEntry.school_id == school_id
    )

    if section_id:
        stmt = stmt.where(
            TimetableEntry.section_id == section_id
        )

    if teacher_id:
        stmt = stmt.where(
            TimetableEntry.teacher_id == teacher_id
        )

    stmt = stmt.order_by(
        TimetableEntry.section_id,
        TimetableEntry.day,
        TimetableEntry.period,
    )

    result = await db.execute(stmt)

    return list(result.scalars().all())


# ============================================================
# EDIT / UPSERT TIMETABLE ENTRY
# ============================================================

@router.put(
    "/{section_id}/{day}/{period}",
    response_model=TimetableEntryOut,
    dependencies=[
        Depends(
            require_feature(
                FeatureCode.EDIT_TIMETABLE
            )
        )
    ],
)
async def upsert_entry(
    section_id: uuid.UUID,
    day: str,
    period: int,
    body: TimetableEntryUpdate,
    school_id: uuid.UUID = Depends(get_scoped_school_id),
    db: AsyncSession = Depends(get_db),
) -> TimetableEntry:
    """
    Update an existing timetable slot.

    Hard constraints:
    - Teacher cannot teach another section at the same time.
    - Teacher cannot be unavailable at the selected slot.
    """

    # --------------------------------------------------------
    # Validate period
    # --------------------------------------------------------

    if period <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Period must be greater than 0.",
        )

    # --------------------------------------------------------
    # Check teacher double-booking
    # --------------------------------------------------------

    conflict = await db.execute(
        select(TimetableEntry).where(
            TimetableEntry.school_id == school_id,
            TimetableEntry.teacher_id == body.teacher_id,
            TimetableEntry.day == day,
            TimetableEntry.period == period,
            TimetableEntry.section_id != section_id,
        )
    )

    if conflict.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "This teacher is already assigned to another "
                "section at this day/period."
            ),
        )

    # --------------------------------------------------------
    # Check teacher availability
    # --------------------------------------------------------

    avail = await db.execute(
        select(TeacherAvailability).where(
            TeacherAvailability.teacher_id
            == body.teacher_id
        )
    )

    availability = avail.scalar_one_or_none()

    if availability:
        schedule = availability.schedule or {}

        day_schedule = schedule.get(day, {})

        is_unavailable = (
            day_schedule.get(str(period)) is False
            or day_schedule.get(period) is False
        )

        if is_unavailable:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    "This teacher has marked themselves "
                    "unavailable for this day/period."
                ),
            )

    # --------------------------------------------------------
    # Find existing timetable entry
    # --------------------------------------------------------

    existing = await db.execute(
        select(TimetableEntry).where(
            TimetableEntry.school_id == school_id,
            TimetableEntry.section_id == section_id,
            TimetableEntry.day == day,
            TimetableEntry.period == period,
        )
    )

    entry = existing.scalar_one_or_none()

    if entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=(
                "No timetable slot exists here yet — "
                "run timetable generation first."
            ),
        )

    # --------------------------------------------------------
    # Update entry
    # --------------------------------------------------------

    entry.subject_id = body.subject_id
    entry.teacher_id = body.teacher_id

    db.add(entry)

    await db.commit()
    await db.refresh(entry)

    return entry


# ============================================================
# GENERATE TIMETABLE
# ============================================================

@router.post(
    "/generate",
    response_model=list[TimetableEntryOut],
    dependencies=[
        Depends(
            require_feature(
                FeatureCode.GENERATE_TIMETABLE
            )
        )
    ],
)
async def generate_timetable(
    config: GenerationConfig,
    school_id: uuid.UUID = Depends(get_scoped_school_id),
    db: AsyncSession = Depends(get_db),
) -> list[TimetableEntry]:
    """
    Generate or regenerate a timetable using the backend
    constraint-aware scheduling engine.

    Supported scopes:

    - entire_school
    - standard
    - section

    The generation engine respects:

    - subject weekly periods
    - teacher-subject assignments
    - teacher-section assignments
    - teacher availability
    - teacher daily maximum periods
    - teacher double-booking prevention
    - locked timetable entries
    - target generation scope
    """

    # --------------------------------------------------------
    # Find school
    # --------------------------------------------------------

    school_result = await db.execute(
        select(School).where(
            School.id == school_id
        )
    )

    school = school_result.scalar_one_or_none()

    if school is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found.",
        )

    # --------------------------------------------------------
    # Validate generation scope
    # --------------------------------------------------------

    valid_scopes = {
        "entire_school",
        "standard",
        "section",
    }

    if config.scope not in valid_scopes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Invalid generation scope. "
                "Expected one of: "
                "entire_school, standard, section."
            ),
        )

    # --------------------------------------------------------
    # Validate target IDs
    # --------------------------------------------------------

    if (
        config.scope == "standard"
        and config.target_standard_id is None
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "target_standard_id is required "
                "when scope is 'standard'."
            ),
        )

    if (
        config.scope == "section"
        and config.target_section_id is None
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "target_section_id is required "
                "when scope is 'section'."
            ),
        )

    # --------------------------------------------------------
    # Run generation engine
    # --------------------------------------------------------

    try:
        entries = await run_timetable_generation(
            db=db,
            school=school,
            config=config,
        )

    except TimetableGenerationError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc

    # --------------------------------------------------------
    # Return generated timetable
    # --------------------------------------------------------

    return entries