import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_scoped_school_id, require_feature
from app.core.permissions import FeatureCode
from app.db.session import get_db
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


@router.get("", response_model=list[SubjectOut])
async def list_subjects(
    school_id: uuid.UUID = Depends(get_scoped_school_id), db: AsyncSession = Depends(get_db)
) -> list[Subject]:
    result = await db.execute(select(Subject).where(Subject.school_id == school_id).order_by(Subject.name))
    return list(result.scalars().all())


@router.post("", response_model=SubjectOut, status_code=status.HTTP_201_CREATED, dependencies=[_manage])
async def create_subject(
    body: SubjectCreate, school_id: uuid.UUID = Depends(get_scoped_school_id), db: AsyncSession = Depends(get_db)
) -> Subject:
    existing = await db.execute(
        select(Subject).where(Subject.school_id == school_id, Subject.code == body.code)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status.HTTP_409_CONFLICT, "A subject with this code already exists.")

    count = (await db.execute(select(Subject).where(Subject.school_id == school_id))).scalars().all()
    bg, text, border = _COLOR_PALETTE[len(count) % len(_COLOR_PALETTE)]

    subject = Subject(
        school_id=school_id,
        name=body.name,
        code=body.code,
        weekly_periods=body.weekly_periods,
        color_bg=bg,
        color_text=text,
        color_border=border,
    )
    db.add(subject)
    await db.flush()
    for standard_id in body.standard_ids:
        db.add(SubjectStandard(subject_id=subject.id, standard_id=standard_id))
    await db.commit()
    await db.refresh(subject)
    return subject


@router.patch("/{subject_id}", response_model=SubjectOut, dependencies=[_manage])
async def update_subject(
    subject_id: uuid.UUID,
    body: SubjectUpdate,
    school_id: uuid.UUID = Depends(get_scoped_school_id),
    db: AsyncSession = Depends(get_db),
) -> Subject:
    subject = await db.get(Subject, subject_id)
    if subject is None or subject.school_id != school_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Subject not found.")
    for field in ("name", "code", "weekly_periods"):
        value = getattr(body, field)
        if value is not None:
            setattr(subject, field, value)
    db.add(subject)
    await db.commit()
    await db.refresh(subject)
    return subject


@router.delete("/{subject_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[_manage])
async def delete_subject(
    subject_id: uuid.UUID, school_id: uuid.UUID = Depends(get_scoped_school_id), db: AsyncSession = Depends(get_db)
) -> None:
    subject = await db.get(Subject, subject_id)
    if subject is None or subject.school_id != school_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Subject not found.")
    await db.delete(subject)
    await db.commit()
