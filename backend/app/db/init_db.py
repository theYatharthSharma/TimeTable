
"""
One-time bootstrap: create tables, seed the feature catalog, and create
the first admin user if none exists. If the configured admin already
exists, update its password from FIRST_ADMIN_PASSWORD.

Run with:
    python -m app.db.init_db

Use Alembic migrations as the normal production schema-management process.
"""
import asyncio

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.permissions import DEFAULT_FEATURES
from app.core.security import hash_password
from app.db.base import Base  # noqa: F401 - registers models on Base.metadata
from app.db.session import AsyncSessionLocal, engine
from app.models.feature import Feature
from app.models.user import User, UserRole


async def create_tables() -> None:
    """Create any database tables that do not already exist."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def seed_features(db: AsyncSession) -> None:
    """Insert missing feature catalog entries."""
    for code, name, description, category in DEFAULT_FEATURES:
        existing = await db.get(Feature, code.value)

        if existing is None:
            db.add(
                Feature(
                    code=code.value,
                    name=name,
                    description=description,
                    category=category,
                )
            )

    await db.commit()


async def seed_admin(db: AsyncSession) -> None:
    """
    Create the configured admin if no admin exists.

    If the configured admin email already exists, update that account's
    password hash using FIRST_ADMIN_PASSWORD.
    """
    result = await db.execute(
        select(User).where(User.email == settings.FIRST_ADMIN_EMAIL)
    )
    admin = result.scalar_one_or_none()

    if admin is not None:
        admin.hashed_password = hash_password(settings.FIRST_ADMIN_PASSWORD)
        await db.commit()
        print(f"Updated admin password for: {settings.FIRST_ADMIN_EMAIL}")
        return

    # Do not silently create a second admin if a different admin exists.
    existing_admin_result = await db.execute(
        select(User).where(User.role == UserRole.ADMIN)
    )
    existing_admin = existing_admin_result.scalar_one_or_none()

    if existing_admin is not None:
        print(
            "An admin account already exists with a different email. "
            "No new admin was created."
        )
        return

    admin = User(
        full_name=settings.FIRST_ADMIN_NAME,
        email=settings.FIRST_ADMIN_EMAIL,
        hashed_password=hash_password(settings.FIRST_ADMIN_PASSWORD),
        role=UserRole.ADMIN,
        school_id=None,
    )

    db.add(admin)
    await db.commit()
    print(f"Created first admin: {settings.FIRST_ADMIN_EMAIL}")


async def main() -> None:
    """Initialize the database and bootstrap the admin account."""
    await create_tables()

    async with AsyncSessionLocal() as db:
        await seed_features(db)
        await seed_admin(db)


if __name__ == "__main__":
    asyncio.run(main())
