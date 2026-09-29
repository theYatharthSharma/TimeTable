"""
Everything a principal can do inside THEIR OWN school:
  - manage teacher profiles / accounts
  - see which features they currently hold (and can therefore delegate)
  - grant/revoke features to teachers in their school
"""
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_role
from app.core.security import hash_password
from app.db.session import get_db
from app.models.feature import Feature
from app.models.permission_grant import PermissionGrant
from app.models.teacher import Teacher
from app.models.user import User, UserRole
from app.schemas.permission import GrantCreate, GrantOut
from app.schemas.user import TeacherAccountCreate, UserOut
from app.services import permission_service

router = APIRouter(
    prefix="/principal", tags=["principal"], dependencies=[Depends(require_role(UserRole.PRINCIPAL))]
)


@router.get("/permissions/available", response_model=list[str])
async def my_delegable_features(
    db: AsyncSession = Depends(get_db), principal: User = Depends(require_role(UserRole.PRINCIPAL))
) -> list[str]:
    """Feature codes this principal currently holds and can hand to a teacher."""
    return await permission_service.list_delegable_features(db, principal=principal)


@router.post("/teacher-accounts", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_teacher_account(
    body: TeacherAccountCreate,
    db: AsyncSession = Depends(get_db),
    principal: User = Depends(require_role(UserRole.PRINCIPAL)),
) -> User:
    """Create a login account for a Teacher profile that already exists in this school."""
    teacher_profile = await db.get(Teacher, body.teacher_profile_id)
    if teacher_profile is None or teacher_profile.school_id != principal.school_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Teacher profile not found in your school.")

    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status.HTTP_409_CONFLICT, "A user with this email already exists.")

    teacher_user = User(
        full_name=body.full_name,
        email=body.email,
        hashed_password=hash_password(body.password),
        role=UserRole.TEACHER,
        school_id=principal.school_id,
        teacher_profile_id=teacher_profile.id,
    )
    db.add(teacher_user)
    await db.commit()
    await db.refresh(teacher_user)
    return teacher_user


@router.get("/teacher-accounts", response_model=list[UserOut])
async def list_teacher_accounts(
    db: AsyncSession = Depends(get_db), principal: User = Depends(require_role(UserRole.PRINCIPAL))
) -> list[User]:
    result = await db.execute(
        select(User).where(User.role == UserRole.TEACHER, User.school_id == principal.school_id)
    )
    return list(result.scalars().all())


@router.post("/permissions/grant", response_model=GrantOut, status_code=status.HTTP_201_CREATED)
async def grant_permission_to_teacher(
    body: GrantCreate,
    db: AsyncSession = Depends(get_db),
    principal: User = Depends(require_role(UserRole.PRINCIPAL)),
) -> GrantOut:
    teacher = await db.get(User, body.grantee_id)
    if teacher is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found.")
    feature = await db.get(Feature, body.feature_code)
    if feature is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Feature not found.")

    # All cross-school / "do you actually hold this" guardrails live in the
    # service layer — see permission_service.grant_feature_as_principal.
    grant = await permission_service.grant_feature_as_principal(
        db, principal=principal, teacher=teacher, feature_code=body.feature_code
    )
    return grant


@router.post("/permissions/{grant_id}/revoke", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_permission(
    grant_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    principal: User = Depends(require_role(UserRole.PRINCIPAL)),
) -> None:
    grant = await db.get(PermissionGrant, grant_id)
    if grant is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Grant not found.")
    # A principal may only revoke grants they themselves handed out.
    if grant.granted_by_id != principal.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "You can only revoke permissions you granted.")
    await permission_service.revoke_grant(db, grant=grant, cascade=True)


@router.get("/permissions", response_model=list[GrantOut])
async def list_permissions_for_teacher(
    teacher_user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    principal: User = Depends(require_role(UserRole.PRINCIPAL)),
) -> list[GrantOut]:
    teacher = await db.get(User, teacher_user_id)
    if teacher is None or teacher.school_id != principal.school_id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Teacher not found in your school.")
    return await permission_service.list_grants_for_user(db, user_id=teacher_user_id)
