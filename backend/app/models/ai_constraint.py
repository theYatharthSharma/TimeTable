import enum
import uuid

from sqlalchemy import Boolean, Enum, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base_class import Base, TimestampMixin, UUIDPKMixin


class ConstraintType(str, enum.Enum):
    HARD = "Hard Constraint"
    SOFT = "Soft Constraint"


class AiConstraint(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "ai_constraints"

    school_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("schools.id", ondelete="CASCADE"), nullable=False
    )
    subject: Mapped[str | None] = mapped_column(String(100), nullable=True)
    preference: Mapped[str] = mapped_column(String(50), nullable=False)
    period: Mapped[str | None] = mapped_column(String(100), nullable=True)
    type: Mapped[ConstraintType] = mapped_column(Enum(ConstraintType, name="constraint_type"), nullable=False)
    raw_text: Mapped[str] = mapped_column(Text, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
