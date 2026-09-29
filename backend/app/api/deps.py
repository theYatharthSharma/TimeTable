"""
Shared FastAPI dependencies: DB session, current user resolution, and the
role/feature guards every protected endpoint is built from.
"""
import uuid
from collections.abc import Callable

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.permissions import FeatureCode
from app.core.security import decode_token
from app.db.session import get_db
from app.models.user import User, UserRole
from app.services.permission_service import user_has_feature

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)
) -> User:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_token(token)
    if payload is None or payload.get("type") != "access":
        raise credentials_error

    try:
        user_id = uuid.UUID(payload.get("sub"))
    except (TypeError, ValueError):
        raise credentials_error

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None or not user.is_active:
        raise credentials_error
    return user


def require_role(*roles: UserRole) -> Callable:
    async def dependency(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                f"This action requires one of these roles: {', '.join(r.value for r in roles)}.",
            )
        return current_user

    return dependency


async def get_scoped_school_id(
    school_id: uuid.UUID | None = None, current_user: User = Depends(get_current_user)
) -> uuid.UUID:
    """
    Resolve which school a domain-data request (subjects, sections, timetable...)
    operates on. Principals and teachers are always confined to their own
    school; an admin has no home school and must pass ?school_id=... explicitly.
    """
    if current_user.role == UserRole.ADMIN:
        if school_id is None:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST, "Admin requests must include a school_id query parameter."
            )
        return school_id
    if current_user.school_id is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Your account is not assigned to a school.")
    return current_user.school_id


def require_feature(feature: FeatureCode) -> Callable:
    """
    Gate an endpoint behind a feature grant. Admin always passes. A
    principal or teacher passes only if they hold an ACTIVE PermissionGrant
    for this feature (granted by an admin, or delegated by their principal).
    """
    async def dependency(
        current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)
    ) -> User:
        if not await user_has_feature(db, user=current_user, feature_code=feature.value):
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                f"You do not have the '{feature.value}' permission. Ask your admin or principal to grant it.",
            )
        return current_user

    return dependency
