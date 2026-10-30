import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_scoped_school_id, require_feature
from app.core.permissions import FeatureCode
from app.db.session import get_db
from app.models.academic import Standard
from app.models.subject import Subject, SubjectStandard
from app.schemas.subject import SubjectCreate, SubjectOut, SubjectUpdate

router = APIRouter(prefix="/subjects", tags=["subjects"])

_COLOR_PALETTE = [
    ("bg-blue-50/90", "text-blue-700", "border-blue-200/80"),
    ("bg-emerald-50/90", "text-emerald-700", "border-emerald-200/80"),
    ("bg-indigo-50/90", "text-indigo-700", "border-indigo-200/80"),
    ("bg-amber-50/90", "text-amber-800", "border-amber-200/80"),
    ("bg-teal-50/90", "text-teal-700", "border-teal-200/80"),
]

_manage = Depends(require_feature(FeatureCode.MANAGE_SUBJECTS))


async def _subject_out(
    db: AsyncSession, subject: Subject
) -> SubjectOut:
    """Build a response including the subject's persisted standard associations."""
    result = await db.execute(
        select(SubjectStandard.standard_id).where(
            SubjectStandard.subject_id == subject.id
        )
    )
    standard_ids = list(result.scalars().all())
    return SubjectOut(
        id=subject.id,
        name=subject.name,
        code=subject.code,
        weekly_periods=subject.weekly_periods,
        color_bg=subject.color_bg,
        color_text=subject.color_text,
        color_border=subject.color_border,
        standard_ids=standard_ids,
    )


async def _validate_standards_belong_to_school(
    db: AsyncSession, standard_ids: list[uuid.UUID], school_id: uuid.UUID
) -> None:
    # Reject duplicates rather than attempting to insert duplicate association rows.
    if len(set(standard_ids)) != len(standard_ids):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="The same standard was selected more than once.",
        )

    if not standard_ids:
        return

    result = await db.execute(
        select(Standard.id).where(
            Standard.school_id == school_id,
            Standard.id.in_(standard_ids),
        )
    )
    valid_ids = set(result.scalars().all())
    if valid_ids != set(standard_ids):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="One or more selected standards do not belong to this school.",
        )


@router.get("", response_model=list[SubjectOut])
async def list_subjects(
    school_id: uuid.UUID = Depends(get_scoped_school_id),
    db: AsyncSession = Depends(get_db),
) -> list[SubjectOut]:
    result = await db.execute(
        select(Subject)
        .where(Subject.school_id == school_id)
        .order_by(Subject.name)
    )
    subjects = list(result.scalars().all())
    return [await _subject_out(db, subject) for subject in subjects]


@router.post(
    "",
    response_model=SubjectOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[_manage],
)
async def create_subject(
    body: SubjectCreate,
    school_id: uuid.UUID = Depends(get_scoped_school_id),
    db: AsyncSession = Depends(get_db),
) -> SubjectOut:
    await _validate_standards_belong_to_school(
        db, body.standard_ids, school_id
    )

    existing = await db.execute(
        select(Subject).where(
            Subject.school_id == school_id,
            Subject.code == body.code,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A subject with this code already exists.",
        )

    existing_subjects = (
        await db.execute(
            select(Subject.id).where(Subject.school_id == school_id)
        )
    ).scalars().all()
    bg, text, border = _COLOR_PALETTE[
        len(existing_subjects) % len(_COLOR_PALETTE)
    ]

    subject = Subject(
        school_id=school_id,
        name=body.name.strip(),
        code=body.code.strip().upper(),
        weekly_periods=body.weekly_periods,
        color_bg=bg,
        color_text=text,
        color_border=border,
    )
    db.add(subject)
    await db.flush()

    for standard_id in body.standard_ids:
        db.add(
            SubjectStandard(
                subject_id=subject.id,
                standard_id=standard_id,
            )
        )

    await db.commit()
    await db.refresh(subject)
    return await _subject_out(db, subject)


@router.patch(
    "/{subject_id}",
    response_model=SubjectOut,
    dependencies=[_manage],
)
async def update_subject(
    subject_id: uuid.UUID,
    body: SubjectUpdate,
    school_id: uuid.UUID = Depends(get_scoped_school_id),
    db: AsyncSession = Depends(get_db),
) -> SubjectOut:
    subject = await db.get(Subject, subject_id)
    if subject is None or subject.school_id != school_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found.",
        )

    if body.standard_ids is not None:
        await _validate_standards_belong_to_school(
            db, body.standard_ids, school_id
        )

    if body.code is not None:
        normalized_code = body.code.strip().upper()
        duplicate = await db.execute(
            select(Subject.id).where(
                Subject.school_id == school_id,
                Subject.code == normalized_code,
                Subject.id != subject_id,
            )
        )
        if duplicate.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A subject with this code already exists.",
            )
        subject.code = normalized_code

    if body.name is not None:
        subject.name = body.name.strip()
    if body.weekly_periods is not None:
        subject.weekly_periods = body.weekly_periods

    if body.standard_ids is not None:
        existing_links = await db.execute(
            select(SubjectStandard).where(
                SubjectStandard.subject_id == subject.id
            )
        )
        for link in existing_links.scalars().all():
            await db.delete(link)

        for standard_id in body.standard_ids:
            db.add(
                SubjectStandard(
                    subject_id=subject.id,
                    standard_id=standard_id,
                )
            )

    await db.commit()
    await db.refresh(subject)
    return await _subject_out(db, subject)


@router.delete(
    "/{subject_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[_manage],
)
async def delete_subject(
    subject_id: uuid.UUID,
    school_id: uuid.UUID = Depends(get_scoped_school_id),
    db: AsyncSession = Depends(get_db),
) -> None:
    subject = await db.get(Subject, subject_id)
    if subject is None or subject.school_id != school_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Subject not found.",
        )

    await db.delete(subject)
    await db.commit()
