"""
One-time bootstrap: create tables (dev convenience; use Alembic in
production), seed the feature catalog, and create the first admin user
if none exists yet.

    python -m app.db.init_db
"""
import asyncio

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.permissions import DEFAULT_FEATURES
from app.core.security import hash_password
from app.db.base import Base  # noqa: F401  (registers all models on Base.metadata)
from app.db.session import AsyncSessionLocal, engine
from app.models.feature import Feature
from app.models.user import User, UserRole


async def create_tables() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def seed_features(db: AsyncSession) -> None:
    for code, name, description, category in DEFAULT_FEATURES:
        existing = await db.get(Feature, code.value)
        if existing is None:
            db.add(Feature(code=code.value, name=name, description=description, category=category))
    await db.commit()


async def seed_admin(db: AsyncSession) -> None:
    result = await db.execute(select(User).where(User.role == UserRole.ADMIN))
    if result.scalar_one_or_none() is not None:
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
    await create_tables()
    async with AsyncSessionLocal() as db:
        await seed_features(db)
        await seed_admin(db)


if __name__ == "__main__":
    asyncio.run(main())
