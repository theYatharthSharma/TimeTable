from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from app.api.deps import get_scoped_school_id, require_feature
from app.core.permissions import FeatureCode
from app.db.session import get_db
from app.models.school import School
from app.schemas.school import SchoolOut, SchoolUpdate

router = APIRouter(prefix="/settings", tags=["school settings"])


@router.get("", response_model=SchoolOut)
async def get_school_settings(
    school_id: uuid.UUID = Depends(get_scoped_school_id), db: AsyncSession = Depends(get_db)
) -> School:
    return await db.get(School, school_id)


@router.patch(
    "",
    response_model=SchoolOut,
    dependencies=[Depends(require_feature(FeatureCode.MANAGE_SCHOOL_SETTINGS))],
)
async def update_school_settings(
    body: SchoolUpdate,
    school_id: uuid.UUID = Depends(get_scoped_school_id),
    db: AsyncSession = Depends(get_db),
) -> School:
    school = await db.get(School, school_id)
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(school, field, value)
    db.add(school)
    await db.commit()
    await db.refresh(school)
    return school
