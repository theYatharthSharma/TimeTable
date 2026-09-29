import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_scoped_school_id, require_feature
from app.core.permissions import FeatureCode
from app.db.session import get_db
from app.models.ai_constraint import AiConstraint, ConstraintType
from app.schemas.ai_constraint import AiConstraintOut

router = APIRouter(prefix="/ai-constraints", tags=["ai constraints"])

_manage = Depends(require_feature(FeatureCode.MANAGE_AI_CONSTRAINTS))


@router.get("", response_model=list[AiConstraintOut])
async def list_constraints(
    school_id: uuid.UUID = Depends(get_scoped_school_id), db: AsyncSession = Depends(get_db)
) -> list[AiConstraint]:
    result = await db.execute(select(AiConstraint).where(AiConstraint.school_id == school_id))
    return list(result.scalars().all())


@router.post("", response_model=AiConstraintOut, status_code=status.HTTP_201_CREATED, dependencies=[_manage])
async def create_constraint(
    raw_text: str,
    subject: str | None = None,
    preference: str = "Prefer",
    period: str | None = None,
    constraint_type: ConstraintType = ConstraintType.SOFT,
    school_id: uuid.UUID = Depends(get_scoped_school_id),
    db: AsyncSession = Depends(get_db),
) -> AiConstraint:
    constraint = AiConstraint(
        school_id=school_id,
        subject=subject,
        preference=preference,
        period=period,
        type=constraint_type,
        raw_text=raw_text,
        active=True,
    )
    db.add(constraint)
    await db.commit()
    await db.refresh(constraint)
    return constraint


@router.delete("/{constraint_id}", status_code=status.HTTP_204_NO_CONTENT, dependencies=[_manage])
async def delete_constraint(
    constraint_id: uuid.UUID, school_id: uuid.UUID = Depends(get_scoped_school_id), db: AsyncSession = Depends(get_db)
) -> None:
    constraint = await db.get(AiConstraint, constraint_id)
    if constraint is None or constraint.school_id != school_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Constraint not found.")
    await db.delete(constraint)
    await db.commit()
