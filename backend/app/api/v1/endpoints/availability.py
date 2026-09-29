"""
A teacher may always view/edit their OWN availability — that's basic
self-service, not a delegated admin feature. Editing someone ELSE's
availability (e.g. a principal adjusting a teacher's grid on their behalf)
requires the MANAGE_TEACHER_AVAILABILITY feature grant.
"""
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, get_scoped_school_id, require_feature
from app.core.permissions import FeatureCode
from app.db.session import get_db
from app.models.availability import TeacherAvailability
from app.models.teacher import Teacher
from app.models.user import User, UserRole
from app.schemas.availability import AvailabilityOut, AvailabilityUpdate
from app.services.permission_service import user_has_feature

router = APIRouter(prefix="/availability", tags=["teacher availability"])


async def _get_or_create(
    db: AsyncSession,
    teacher_id: uuid.UUID,
    max_periods: int = 5,
) -> TeacherAvailability:
    result = await db.execute(
        select(TeacherAvailability).where(
            TeacherAvailability.teacher_id == teacher_id
        )
    )
    record = result.scalar_one_or_none()

    if record is None:
        record = TeacherAvailability(
            teacher_id=teacher_id,
            max_periods_per_day=max_periods,
            schedule={},
        )
        db.add(record)
        await db.commit()
        await db.refresh(record)

    return record

async def _authorize_target(db: AsyncSession, current_user: User, teacher_id: uuid.UUID, school_id: uuid.UUID) -> None:
    teacher = await db.get(Teacher, teacher_id)
    if teacher is None or teacher.school_id != school_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Teacher not found.")

    is_self = current_user.role == UserRole.TEACHER and current_user.teacher_profile_id == teacher_id
    if is_self:
        return
    if not await user_has_feature(db, user=current_user, feature_code=FeatureCode.MANAGE_TEACHER_AVAILABILITY.value):
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, "You can only edit your own availability without the manage-availability permission."
        )


@router.get("/{teacher_id}", response_model=AvailabilityOut)
async def get_availability(
    teacher_id: uuid.UUID,
    school_id: uuid.UUID = Depends(get_scoped_school_id),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TeacherAvailability:
    await _authorize_target(db, current_user, teacher_id, school_id)
    return await _get_or_create(db, teacher_id)


@router.put("/{teacher_id}", response_model=AvailabilityOut)
async def update_availability(
    teacher_id: uuid.UUID,
    body: AvailabilityUpdate,
    school_id: uuid.UUID = Depends(get_scoped_school_id),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TeacherAvailability:
    await _authorize_target(db, current_user, teacher_id, school_id)
    record = await _get_or_create(db, teacher_id)
    record.schedule = body.schedule
    if body.max_periods_per_day is not None:
        record.max_periods_per_day = body.max_periods_per_day
    db.add(record)
    await db.commit()
    await db.refresh(record)
    return record
