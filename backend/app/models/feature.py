from sqlalchemy import Boolean, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base, TimestampMixin


class Feature(TimestampMixin, Base):
    """
    Master catalog of grantable features. Seeded from
    app.core.permissions.DEFAULT_FEATURES; an admin may add more via the
    admin API without a code change.
    """
    __tablename__ = "features"

    code: Mapped[str] = mapped_column(String(64), primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str] = mapped_column(String(500), default="")
    category: Mapped[str] = mapped_column(String(50), default="general")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
