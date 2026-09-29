"""
Everything only the master operator (admin) can do:
  - onboard schools
  - create principal accounts for a school
  - manage the feature catalog
  - grant/revoke features to principals
"""
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_role
from app.core.security import hash_password
from app.db.session import get_db
from app.models.feature import Feature
from app.models.school import School
from app.models.user import User, UserRole
from app.schemas.feature import FeatureCreate, FeatureOut
from app.schemas.permission import GrantCreate, GrantOut
from app.schemas.school import SchoolCreate, SchoolOut, SchoolUpdate
from app.schemas.user import PrincipalCreate, UserOut
from app.services import permission_service

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_role(UserRole.ADMIN))])


# ---------- Schools ----------

@router.post("/schools", response_model=SchoolOut, status_code=status.HTTP_201_CREATED)
async def create_school(
    body: SchoolCreate, db: AsyncSession = Depends(get_db), admin: User = Depends(require_role(UserRole.ADMIN))
) -> School:
    school = School(**body.model_dump(), created_by_admin_id=admin.id)
    db.add(school)
    await db.commit()
    await db.refresh(school)
    return school


@router.get("/schools", response_model=list[SchoolOut])
async def list_schools(db: AsyncSession = Depends(get_db)) -> list[School]:
    result = await db.execute(select(School).order_by(School.name))
    return list(result.scalars().all())


@router.patch("/schools/{school_id}", response_model=SchoolOut)
async def update_school(school_id: uuid.UUID, body: SchoolUpdate, db: AsyncSession = Depends(get_db)) -> School:
    school = await db.get(School, school_id)
    if school is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "School not found.")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(school, field, value)
    db.add(school)
    await db.commit()
    await db.refresh(school)
    return school


# ---------- Principals ----------

@router.post("/principals", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_principal(body: PrincipalCreate, db: AsyncSession = Depends(get_db)) -> User:
    school = await db.get(School, body.school_id)
    if school is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "School not found.")

    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status.HTTP_409_CONFLICT, "A user with this email already exists.")

    principal = User(
        full_name=body.full_name,
        email=body.email,
        hashed_password=hash_password(body.password),
        role=UserRole.PRINCIPAL,
        school_id=school.id,
    )
    db.add(principal)
    await db.commit()
    await db.refresh(principal)
    return principal


@router.get("/principals", response_model=list[UserOut])
async def list_principals(school_id: uuid.UUID | None = None, db: AsyncSession = Depends(get_db)) -> list[User]:
    stmt = select(User).where(User.role == UserRole.PRINCIPAL)
    if school_id:
        stmt = stmt.where(User.school_id == school_id)
    result = await db.execute(stmt)
    return list(result.scalars().all())


@router.patch("/principals/{principal_id}/deactivate", response_model=UserOut)
async def deactivate_principal(principal_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> User:
    principal = await db.get(User, principal_id)
    if principal is None or principal.role != UserRole.PRINCIPAL:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Principal not found.")
    principal.is_active = False
    db.add(principal)
    await db.commit()
    await db.refresh(principal)
    return principal


# ---------- Feature catalog ----------

@router.get("/features", response_model=list[FeatureOut])
async def list_features(db: AsyncSession = Depends(get_db)) -> list[Feature]:
    result = await db.execute(select(Feature).order_by(Feature.category, Feature.name))
    return list(result.scalars().all())


@router.post("/features", response_model=FeatureOut, status_code=status.HTTP_201_CREATED)
async def create_feature(body: FeatureCreate, db: AsyncSession = Depends(get_db)) -> Feature:
    existing = await db.get(Feature, body.code)
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, "A feature with this code already exists.")
    feature = Feature(**body.model_dump())
    db.add(feature)
    await db.commit()
    await db.refresh(feature)
    return feature


# ---------- Permission grants (admin -> principal) ----------

@router.post("/permissions/grant", response_model=GrantOut, status_code=status.HTTP_201_CREATED)
async def grant_permission_to_principal(
    body: GrantCreate, db: AsyncSession = Depends(get_db), admin: User = Depends(require_role(UserRole.ADMIN))
) -> GrantOut:
    principal = await db.get(User, body.grantee_id)
    if principal is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found.")
    feature = await db.get(Feature, body.feature_code)
    if feature is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Feature not found.")

    grant = await permission_service.grant_feature_as_admin(
        db, admin=admin, principal=principal, feature_code=body.feature_code
    )
    return grant


@router.post("/permissions/{grant_id}/revoke", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_permission(grant_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> None:
    from app.models.permission_grant import PermissionGrant

    grant = await db.get(PermissionGrant, grant_id)
    if grant is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Grant not found.")
    await permission_service.revoke_grant(db, grant=grant, cascade=True)


@router.get("/permissions", response_model=list[GrantOut])
async def list_permissions_for_user(user_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> list[GrantOut]:
    return await permission_service.list_grants_for_user(db, user_id=user_id)
