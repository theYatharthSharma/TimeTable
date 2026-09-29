"""
All permission-grant business rules live here so the API layer stays a
thin translation of HTTP <-> service calls. See app.core.permissions for
the conceptual model.
"""
import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.permission_grant import PermissionGrant
from app.models.user import User, UserRole


async def get_active_grant(
    db: AsyncSession, *, grantee_id: uuid.UUID, feature_code: str
) -> PermissionGrant | None:
    result = await db.execute(
        select(PermissionGrant).where(
            PermissionGrant.grantee_id == grantee_id,
            PermissionGrant.feature_code == feature_code,
            PermissionGrant.is_active.is_(True),
        )
    )
    return result.scalar_one_or_none()


async def user_has_feature(db: AsyncSession, *, user: User, feature_code: str) -> bool:
    """Admin implicitly has every feature; everyone else needs an active grant."""
    if user.role == UserRole.ADMIN:
        return True
    grant = await get_active_grant(db, grantee_id=user.id, feature_code=feature_code)
    return grant is not None


async def grant_feature_as_admin(
    db: AsyncSession, *, admin: User, principal: User, feature_code: str
) -> PermissionGrant:
    """Admin grants a feature to a principal. This is always a root grant."""
    if principal.role != UserRole.PRINCIPAL:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Grantee must be a principal.")
    if principal.school_id is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Principal is not assigned to a school.")

    existing = await get_active_grant(db, grantee_id=principal.id, feature_code=feature_code)
    if existing:
        return existing

    grant = PermissionGrant(
        school_id=principal.school_id,
        grantee_id=principal.id,
        feature_code=feature_code,
        granted_by_id=admin.id,
        parent_grant_id=None,
    )
    db.add(grant)
    await db.commit()
    await db.refresh(grant)
    return grant


async def grant_feature_as_principal(
    db: AsyncSession, *, principal: User, teacher: User, feature_code: str
) -> PermissionGrant:
    """
    Principal delegates a feature to a teacher in their own school.
    Guardrails enforced here (not just in the router) because this is
    the rule that actually protects the permission model:

      1. The teacher must belong to the SAME school as the principal.
      2. The principal must CURRENTLY hold an active grant for this exact
         feature — you cannot hand out what you don't have.
    """
    if teacher.role != UserRole.TEACHER:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Grantee must be a teacher.")
    if teacher.school_id != principal.school_id:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, "You can only grant permissions to teachers in your own school."
        )

    principals_own_grant = await get_active_grant(
        db, grantee_id=principal.id, feature_code=feature_code
    )
    if principals_own_grant is None:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            "You cannot delegate a feature you do not currently hold. Ask an admin to grant it to you first.",
        )

    existing = await get_active_grant(db, grantee_id=teacher.id, feature_code=feature_code)
    if existing:
        return existing

    grant = PermissionGrant(
        school_id=principal.school_id,
        grantee_id=teacher.id,
        feature_code=feature_code,
        granted_by_id=principal.id,
        parent_grant_id=principals_own_grant.id,
    )
    db.add(grant)
    await db.commit()
    await db.refresh(grant)
    return grant


async def revoke_grant(db: AsyncSession, *, grant: PermissionGrant, cascade: bool = True) -> None:
    """
    Deactivate a grant. When cascade=True (the default and the only safe
    option for this model), every grant that was delegated FROM this one
    is revoked too — a principal losing MANAGE_SUBJECTS must not leave a
    teacher they delegated it to still holding it.
    """
    if not grant.is_active:
        return

    grant.is_active = False
    grant.revoked_at = datetime.now(timezone.utc)
    db.add(grant)

    if cascade:
        result = await db.execute(
            select(PermissionGrant).where(
                PermissionGrant.parent_grant_id == grant.id,
                PermissionGrant.is_active.is_(True),
            )
        )
        for child in result.scalars().all():
            await revoke_grant(db, grant=child, cascade=True)

    await db.commit()


async def list_grants_for_user(db: AsyncSession, *, user_id: uuid.UUID) -> list[PermissionGrant]:
    result = await db.execute(
        select(PermissionGrant).where(PermissionGrant.grantee_id == user_id).order_by(PermissionGrant.granted_at.desc())
    )
    return list(result.scalars().all())


async def list_delegable_features(db: AsyncSession, *, principal: User) -> list[str]:
    """Feature codes a principal currently holds and could delegate to a teacher."""
    result = await db.execute(
        select(PermissionGrant.feature_code).where(
            PermissionGrant.grantee_id == principal.id,
            PermissionGrant.is_active.is_(True),
        )
    )
    return [row[0] for row in result.all()]
