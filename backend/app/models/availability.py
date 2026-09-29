import uuid

from sqlalchemy import ForeignKey, Integer
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base, TimestampMixin, UUIDPKMixin


class TeacherAvailability(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "teacher_availabilities"

    teacher_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("teachers.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    max_periods_per_day: Mapped[int] = mapped_column(Integer, default=5)
    # {"Monday": {"1": true, "2": false, ...}, ...}
    schedule: Mapped[dict] = mapped_column(JSONB, default=dict)
