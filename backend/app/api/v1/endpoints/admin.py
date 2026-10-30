
"""
Everything only the master operator (admin) can do:
  - onboard schools
  - create principal accounts for a school
  - manage the feature catalog
  - grant/revoke features to principals
  - deactivate/reactivate principal accounts
  - permanently delete principal accounts safely
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import delete, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_role
from app.core.security import hash_password
from app.db.session import get_db

from app.models.feature import Feature
from app.models.academic import Standard, Section
from app.models.subject import Subject
from app.models.teacher import Teacher, TeacherStandard, TeacherSubject, TeacherSection
from app.models.timetable import TimetableEntry
from app.models.ai_constraint import AiConstraint
from app.models.permission_grant import PermissionGrant
from app.models.school import School
from app.models.user import User, UserRole

from app.schemas.feature import FeatureCreate, FeatureOut
from app.schemas.permission import GrantCreate, GrantOut
from app.schemas.school import SchoolCreate, SchoolOut, SchoolUpdate
from app.schemas.user import PrincipalCreate, TeacherAccountCreate, UserOut
from app.schemas.teacher import AdminTeacherCreate

from app.services import permission_service


router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(require_role(UserRole.ADMIN))],
)


# ---------- Schools ----------

@router.post(
    "/schools",
    response_model=SchoolOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_school(
    body: SchoolCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role(UserRole.ADMIN)),
) -> School:
    school = School(
        **body.model_dump(),
        created_by_admin_id=admin.id,
    )

    db.add(school)
    await db.commit()
    await db.refresh(school)

    return school


@router.get("/schools", response_model=list[SchoolOut])
async def list_schools(
    db: AsyncSession = Depends(get_db),
) -> list[School]:
    result = await db.execute(
        select(School).order_by(School.name)
    )
    return list(result.scalars().all())


@router.delete(
    "/schools/{school_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_school(
    school_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> None:
    """Delete an unused school without cascading through academic data."""

    school = await db.get(School, school_id)

    if school is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found.",
        )

    linked_models = [
        User,
        Teacher,
        Subject,
        Standard,
        Section,
        TimetableEntry,
        AiConstraint,
        PermissionGrant,
    ]

    for model in linked_models:
        result = await db.execute(
            select(model)
            .where(model.school_id == school_id)
            .limit(1)
        )

        if result.scalar_one_or_none() is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=(
                    f"Cannot delete this school: linked record found in "
                    f"{model.__name__}. Remove or transfer that record first."
                ),
            )

    try:
        await db.delete(school)
        await db.commit()
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Cannot delete this school because other database records "
                "still reference it."
            ),
        ) from exc


@router.patch(
    "/schools/{school_id}",
    response_model=SchoolOut,
)
async def update_school(
    school_id: uuid.UUID,
    body: SchoolUpdate,
    db: AsyncSession = Depends(get_db),
) -> School:
    school = await db.get(School, school_id)

    if school is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found.",
        )

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(school, field, value)

    db.add(school)
    await db.commit()
    await db.refresh(school)

    return school


# ---------- Principals ----------

@router.post(
    "/principals",
    response_model=UserOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_principal(
    body: PrincipalCreate,
    db: AsyncSession = Depends(get_db),
) -> User:
    school = await db.get(School, body.school_id)

    if school is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found.",
        )

    existing = await db.execute(
        select(User).where(User.email == body.email)
    )

    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists.",
        )

    principal = User(
        full_name=body.full_name,
        email=body.email,
        hashed_password=hash_password(body.password),
        role=UserRole.PRINCIPAL,
        school_id=school.id,
    )

    db.add(principal)

    try:
        await db.commit()
        await db.refresh(principal)
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Could not create the principal. The email may already "
                "be registered or a database constraint was violated."
            ),
        ) from exc

    return principal


# ---------- Combined Teacher Profile + Login ----------

@router.post(
    "/teachers",
    response_model=UserOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_teacher_with_login(
    body: AdminTeacherCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role(UserRole.ADMIN)),
) -> User:
    """Create a teacher profile, academic assignments, and login atomically."""

    school = await db.get(School, body.school_id)
    if school is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="School not found.",
        )

    existing_user = await db.execute(
        select(User).where(User.email == str(body.email))
    )
    if existing_user.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists.",
        )

    existing_teacher = await db.execute(
        select(Teacher).where(
            Teacher.school_id == body.school_id,
            Teacher.email == str(body.email),
        )
    )
    if existing_teacher.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A teacher profile with this email already exists in this school.",
        )

    assignments = [
        (Standard, body.standard_ids, "standard"),
        (Subject, body.subject_ids, "subject"),
        (Section, body.section_ids, "section"),
    ]

    for model, ids, label in assignments:
        if len(set(ids)) != len(ids):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Duplicate {label} assignment.",
            )

        if ids:
            result = await db.execute(
                select(model.id).where(
                    model.school_id == body.school_id,
                    model.id.in_(ids),
                )
            )
            if set(result.scalars().all()) != set(ids):
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"One or more selected {label}s do not belong to this school.",
                )

    try:
        teacher = Teacher(
            school_id=body.school_id,
            name=body.name,
            email=str(body.email),
            phone=body.phone,
            max_periods_per_day=body.max_periods_per_day,
            working_days=body.working_days,
        )
        db.add(teacher)
        await db.flush()

        for standard_id in body.standard_ids:
            db.add(TeacherStandard(teacher_id=teacher.id, standard_id=standard_id))
        for subject_id in body.subject_ids:
            db.add(TeacherSubject(teacher_id=teacher.id, subject_id=subject_id))
        for section_id in body.section_ids:
            db.add(TeacherSection(teacher_id=teacher.id, section_id=section_id))

        teacher_user = User(
            full_name=body.name,
            email=str(body.email),
            hashed_password=hash_password(body.password),
            role=UserRole.TEACHER,
            school_id=teacher.school_id,
            teacher_profile_id=teacher.id,
        )
        db.add(teacher_user)
        await db.commit()
        await db.refresh(teacher_user)
        return teacher_user

    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Teacher account creation failed because of duplicate data "
                "or a database constraint."
            ),
        ) from exc
    except Exception:
        await db.rollback()
        raise


@router.post(
    "/teacher-accounts",
    response_model=UserOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_teacher_account(
    body: TeacherAccountCreate,
    db: AsyncSession = Depends(get_db),
) -> User:
    """Admin creates a login for an already-existing teacher profile."""

    teacher_profile = await db.get(Teacher, body.teacher_profile_id)
    if teacher_profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Teacher profile not found.",
        )

    existing = await db.execute(select(User).where(User.email == str(body.email)))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists.",
        )

    teacher_user = User(
        full_name=body.full_name,
        email=str(body.email),
        hashed_password=hash_password(body.password),
        role=UserRole.TEACHER,
        school_id=teacher_profile.school_id,
        teacher_profile_id=teacher_profile.id,
    )
    db.add(teacher_user)
    try:
        await db.commit()
        await db.refresh(teacher_user)
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Could not create the teacher account; check email and profile links.",
        ) from exc
    return teacher_user


@router.get(
    "/principals",
    response_model=list[UserOut],
)
async def list_principals(
    school_id: uuid.UUID | None = None,
    db: AsyncSession = Depends(get_db),
) -> list[User]:
    stmt = select(User).where(
        User.role == UserRole.PRINCIPAL
    )

    if school_id is not None:
        stmt = stmt.where(User.school_id == school_id)

    result = await db.execute(
        stmt.order_by(User.full_name)
    )

    return list(result.scalars().all())


@router.patch(
    "/principals/{principal_id}/deactivate",
    response_model=UserOut,
)
async def deactivate_principal(
    principal_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> User:
    principal = await db.get(User, principal_id)

    if principal is None or principal.role != UserRole.PRINCIPAL:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Principal not found.",
        )

    if not principal.is_active:
        return principal

    principal.is_active = False
    db.add(principal)
    await db.commit()
    await db.refresh(principal)

    return principal


@router.patch(
    "/principals/{principal_id}/reactivate",
    response_model=UserOut,
)
async def reactivate_principal(
    principal_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> User:
    """Reactivate an existing principal account."""

    principal = await db.get(User, principal_id)

    if principal is None or principal.role != UserRole.PRINCIPAL:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Principal not found.",
        )

    if principal.is_active:
        return principal

    principal.is_active = True
    db.add(principal)
    await db.commit()
    await db.refresh(principal)

    return principal


@router.delete(
    "/principals/{principal_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_principal(
    principal_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> None:
    """
    Permanently delete a principal account and its direct permission grants.

    This deliberately does not delete the school, teachers, subjects,
    sections, or timetable records. If other records reference the user,
    the database constraint prevents deletion and the transaction rolls back.
    """

    principal = await db.get(User, principal_id)

    if principal is None or principal.role != UserRole.PRINCIPAL:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Principal not found.",
        )

    try:
        # Remove grants assigned to this principal.
        # This uses the grantee_id field used by GrantCreate.
        await db.execute(
            delete(PermissionGrant).where(
                PermissionGrant.grantee_id == principal.id
            )
        )

        # Delete only the principal account itself.
        await db.delete(principal)
        await db.commit()

    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Cannot permanently delete this principal because other "
                "records still reference the account. Resolve those "
                "references first; no deletion was committed."
            ),
        ) from exc


# ---------- Feature catalog ----------

@router.get(
    "/features",
    response_model=list[FeatureOut],
)
async def list_features(
    db: AsyncSession = Depends(get_db),
) -> list[Feature]:
    result = await db.execute(
        select(Feature).order_by(
            Feature.category,
            Feature.name,
        )
    )

    return list(result.scalars().all())


@router.post(
    "/features",
    response_model=FeatureOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_feature(
    body: FeatureCreate,
    db: AsyncSession = Depends(get_db),
) -> Feature:
    existing = await db.get(Feature, body.code)

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A feature with this code already exists.",
        )

    feature = Feature(**body.model_dump())
    db.add(feature)

    try:
        await db.commit()
        await db.refresh(feature)
    except IntegrityError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Could not create the feature because of a database constraint.",
        ) from exc

    return feature


# ---------- Permission grants (admin -> principal) ----------

@router.post(
    "/permissions/grant",
    response_model=GrantOut,
    status_code=status.HTTP_201_CREATED,
)
async def grant_permission_to_principal(
    body: GrantCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role(UserRole.ADMIN)),
) -> GrantOut:
    principal = await db.get(User, body.grantee_id)

    if principal is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    if principal.role != UserRole.PRINCIPAL:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Permissions can only be granted to a principal account.",
        )

    if not principal.is_active:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot grant permissions to an inactive principal.",
        )

    feature = await db.get(Feature, body.feature_code)

    if feature is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feature not found.",
        )

    grant = await permission_service.grant_feature_as_admin(
        db,
        admin=admin,
        principal=principal,
        feature_code=body.feature_code,
    )

    return grant


@router.post(
    "/permissions/{grant_id}/revoke",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def revoke_permission(
    grant_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> None:
    grant = await db.get(PermissionGrant, grant_id)

    if grant is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Grant not found.",
        )

    await permission_service.revoke_grant(
        db,
        grant=grant,
        cascade=True,
    )


@router.get(
    "/permissions",
    response_model=list[GrantOut],
)
async def list_permissions_for_user(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> list[GrantOut]:
    return await permission_service.list_grants_for_user(
        db,
        user_id=user_id,
    )
