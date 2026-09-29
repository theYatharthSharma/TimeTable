import uuid

from sqlalchemy import ARRAY, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base, TimestampMixin, UUIDPKMixin


class School(UUIDPKMixin, TimestampMixin, Base):
    """
    A school is the scoping boundary for principals, teachers, and all
    academic data. Only an admin can create one.
    """
    __tablename__ = "schools"

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    academic_year: Mapped[str] = mapped_column(String(20), default="2026-27")
    working_days: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)
    periods_per_day: Mapped[int] = mapped_column(Integer, default=6)
    period_duration_min: Mapped[int] = mapped_column(Integer, default=45)
    start_time: Mapped[str] = mapped_column(String(5), default="08:00")

    created_by_admin_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    users: Mapped[list["User"]] = relationship(back_populates="school", foreign_keys="User.school_id")
