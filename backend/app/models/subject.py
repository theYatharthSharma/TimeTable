import uuid

from sqlalchemy import ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base, TimestampMixin, UUIDPKMixin


class Subject(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "subjects"

    school_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("schools.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    code: Mapped[str] = mapped_column(String(20), nullable=False)
    weekly_periods: Mapped[int] = mapped_column(Integer, default=1)
    color_bg: Mapped[str] = mapped_column(String(40), default="")
    color_text: Mapped[str] = mapped_column(String(40), default="")
    color_border: Mapped[str] = mapped_column(String(40), default="")

    standard_ids: Mapped[list["SubjectStandard"]] = relationship(cascade="all, delete-orphan")

    __table_args__ = (UniqueConstraint("school_id", "code", name="uq_subject_school_code"),)


class SubjectStandard(Base):
    """Which standards a subject is taught in (many-to-many)."""
    __tablename__ = "subject_standards"

    subject_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("subjects.id", ondelete="CASCADE"), primary_key=True
    )
    standard_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("standards.id", ondelete="CASCADE"), primary_key=True
    )
