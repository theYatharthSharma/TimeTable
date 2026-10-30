import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_scoped_school_id, require_feature
from app.core.permissions import FeatureCode
from app.db.session import get_db
from app.models.teacher import Teacher, TeacherSection, TeacherStandard, TeacherSubject
from app.models.academic import Section, Standard
from app.models.subject import Subject
from app.schemas.teacher import TeacherCreate, TeacherOut, TeacherUpdate

router = APIRouter(prefix="/teachers", tags=["teachers"])

_manage = Depends(require_feature(FeatureCode.MANAGE_TEACHERS))


async def _sync_m2m(db, model, fk_field: str, teacher_id: uuid.UUID, other_field: str, ids: list[uuid.UUID]) -> None:
    await db.execute(model.__table__.delete().where(getattr(model, fk_field) == teacher_id))
    for other_id in ids:
        db.add(model(**{fk_field: teacher_id, other_field: other_id}))


async def _teacher_out(db: AsyncSession, teacher: Teacher) -> TeacherOut:
    standards = (await db.execute(select(TeacherStandard.standard_id).where(TeacherStandard.teacher_id == teacher.id))).scalars().all()
    subjects = (await db.execute(select(TeacherSubject.subject_id).where(TeacherSubject.teacher_id == teacher.id))).scalars().all()
    sections = (await db.execute(select(TeacherSection.section_id).where(TeacherSection.teacher_id == teacher.id))).scalars().all()
    return TeacherOut(
        id=teacher.id,
        name=teacher.name,
        email=teacher.email,
        phone=teacher.phone,
        max_periods_per_day=teacher.max_periods_per_day,
        working_days=teacher.working_days,
        standard_ids=list(standards),
        subject_ids=list(subjects),
        section_ids=list(sections),
    )


async def _validate_assignments(db: AsyncSession, school_id: uuid.UUID, standard_ids: list[uuid.UUID], subject_ids: list[uuid.UUID], section_ids: list[uuid.UUID]) -> None:
    checks = (
        (Standard, standard_ids, "standard"),
        (Subject, subject_ids, "subject"),
        (Section, section_ids, "section"),
    )
    for model, ids, label in checks:
        if len(set(ids)) != len(ids):
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, f"Duplicate {label} assignment.")
        if not ids:
            continue
        result = await db.execute(select(model.id).where(model.school_id == school_id, model.id.in_(ids)))
        if set(result.scalars().all()) != set(ids):
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, f"One or more selected {label}s do not belong to this school.")


@router.get("", response_model=list[TeacherOut])
async def list_teachers(
    school_id: uuid.UUID = Depends(get_scoped_school_id), db: AsyncSession = Depends(get_db)
) -> list[Teacher]:
    result = await db.execute(select(Teacher).where(Teacher.school_id == school_id).order_by(Teacher.name))
    teachers = list(result.scalars().all())
    return [await _teacher_out(db, teacher) for teacher in teachers]


@router.post("", response_model=TeacherOut, status_code=status.HTTP_201_CREATED, dependencies=[_manage])
async def create_teacher(
    body: TeacherCreate, school_id: uuid.UUID = Depends(get_scoped_school_id), db: AsyncSession = Depends(get_db)
) -> TeacherOut:
    await _validate_assignments(db, school_id, body.standard_ids, body.subject_ids, body.section_ids)
    teacher = Teacher(
        school_id=school_id,
        name=body.name,
        email=body.email,
        phone=body.phone,
        max_periods_per_day=body.max_periods_per_day,
        working_days=body.working_days,
    )
    db.add(teacher)
    await db.flush()
    for sid in body.standard_ids:
        db.add(TeacherStandard(teacher_id=teacher.id, standard_id=sid))
    for sid in body.subject_ids:
        db.add(TeacherSubject(teacher_id=teacher.id, subject_id=sid))
    for sid in body.section_ids:
        db.add(TeacherSection(teacher_id=teacher.id, section_id=sid))
    await db.commit()
    await db.refresh(teacher)
    return await _teacher_out(db, teacher)


@router.patch("/{teacher_id}", response_model=TeacherOut, dependencies=[_manage])
async def update_teacher(
    teacher_id: uuid.UUID,
    body: TeacherUpdate,
    school_id: uuid.UUID = Depends(get_scoped_school_id),
    db: AsyncSession = Depends(get_db),
) -> TeacherOut:
    teacher = await db.get(Teacher, teacher_id)
    if teacher is None or teacher.school_id != school_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Teacher not found.")

    await _validate_assignments(
        db, school_id,
        body.standard_ids if body.standard_ids is not None else [],
        body.subject_ids if body.subject_ids is not None else [],
        body.section_ids if body.section_ids is not None else [],
    )

    for field in ("name", "email", "phone", "max_periods_per_day", "working_days"):
        value = getattr(body, field)
        if value is not None:
            setattr(teacher, field, value)

    if body.standard_ids is not None:
        await _sync_m2m(db, TeacherStandard, "teacher_id", teacher.id, "standard_id", body.standard_ids)
    if body.subject_ids is not None:
        await _sync_m2m(db, TeacherSubject, "teacher_id", teacher.id, "subject_id", body.subject_ids)
    if body.section_ids is not None:
        await _sync_m2m(db, TeacherSection, "teacher_id", teacher.id, "section_id", body.section_ids)

    db.add(teacher)
    await db.commit()
    await db.refresh(teacher)
    return await _teacher_out(db, teacher)


@router.delete("/{teacher_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[_manage])
async def delete_teacher(
    teacher_id: uuid.UUID, school_id: uuid.UUID = Depends(get_scoped_school_id), db: AsyncSession = Depends(get_db)
) -> None:
    teacher = await db.get(Teacher, teacher_id)
    if teacher is None or teacher.school_id != school_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Teacher not found.")
    await db.delete(teacher)
    await db.commit()
