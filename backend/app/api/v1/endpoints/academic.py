import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_scoped_school_id, require_feature
from app.core.permissions import FeatureCode
from app.db.session import get_db
from app.models.academic import Section, Standard
from app.schemas.academic import SectionCreate, SectionOut, SectionUpdate, StandardCreate, StandardOut

router = APIRouter(prefix="/academic", tags=["standards & sections"])

_manage = Depends(require_feature(FeatureCode.MANAGE_ACADEMIC_STRUCTURE))


@router.get("/standards", response_model=list[StandardOut])
async def list_standards(
    school_id: uuid.UUID = Depends(get_scoped_school_id), db: AsyncSession = Depends(get_db)
) -> list[Standard]:
    result = await db.execute(select(Standard).where(Standard.school_id == school_id).order_by(Standard.level))
    return list(result.scalars().all())


@router.post("/standards", response_model=StandardOut, status_code=status.HTTP_201_CREATED, dependencies=[_manage])
async def create_standard(
    body: StandardCreate, school_id: uuid.UUID = Depends(get_scoped_school_id), db: AsyncSession = Depends(get_db)
) -> Standard:
    standard = Standard(school_id=school_id, level=body.level, name=body.name or f"Standard {body.level}")
    db.add(standard)
    await db.commit()
    await db.refresh(standard)
    return standard


@router.get("/sections", response_model=list[SectionOut])
async def list_sections(
    standard_id: uuid.UUID | None = None,
    school_id: uuid.UUID = Depends(get_scoped_school_id),
    db: AsyncSession = Depends(get_db),
) -> list[Section]:
    stmt = select(Section).where(Section.school_id == school_id)
    if standard_id:
        stmt = stmt.where(Section.standard_id == standard_id)
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.post("/sections", response_model=SectionOut, status_code=status.HTTP_201_CREATED, dependencies=[_manage])
async def create_section(
    body: SectionCreate, school_id: uuid.UUID = Depends(get_scoped_school_id), db: AsyncSession = Depends(get_db)
) -> Section:
    standard = await db.get(Standard, body.standard_id)
    if standard is None or standard.school_id != school_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Standard not found in this school.")
    section = Section(
        school_id=school_id, standard_id=body.standard_id, name=body.name.upper(), room_number=body.room_number
    )
    db.add(section)
    await db.commit()
    await db.refresh(section)
    return section


@router.patch("/sections/{section_id}", response_model=SectionOut, dependencies=[_manage])
async def update_section(
    section_id: uuid.UUID,
    body: SectionUpdate,
    school_id: uuid.UUID = Depends(get_scoped_school_id),
    db: AsyncSession = Depends(get_db),
) -> Section:
    section = await db.get(Section, section_id)
    if section is None or section.school_id != school_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Section not found.")
    for field in ("name", "room_number"):
        value = getattr(body, field)
        if value is not None:
            setattr(section, field, value)
    db.add(section)
    await db.commit()
    await db.refresh(section)
    return section


@router.delete("/sections/{section_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[_manage])
async def delete_section(
    section_id: uuid.UUID, school_id: uuid.UUID = Depends(get_scoped_school_id), db: AsyncSession = Depends(get_db)
) -> None:
    section = await db.get(Section, section_id)
    if section is None or section.school_id != school_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Section not found.")
    await db.delete(section)
    await db.commit()
