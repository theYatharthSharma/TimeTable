import uuid

from sqlalchemy import ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base, TimestampMixin, UUIDPKMixin


class Standard(UUIDPKMixin, TimestampMixin, Base):
    """A grade/class level, e.g. 'Standard 8'."""
    __tablename__ = "standards"

    school_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("schools.id", ondelete="CASCADE"), nullable=False
    )
    level: Mapped[int] = mapped_column(Integer, nullable=False)
    name: Mapped[str] = mapped_column(String(50), nullable=False)

    sections: Mapped[list["Section"]] = relationship(back_populates="standard", cascade="all, delete-orphan")

    __table_args__ = (UniqueConstraint("school_id", "level", name="uq_standard_school_level"),)


class Section(UUIDPKMixin, TimestampMixin, Base):
    """A section within a standard, e.g. '8A'."""
    __tablename__ = "sections"

    school_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("schools.id", ondelete="CASCADE"), nullable=False
    )
    standard_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("standards.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(10), nullable=False)  # 'A', 'B', ...
    room_number: Mapped[str | None] = mapped_column(String(20), nullable=True)

    standard: Mapped["Standard"] = relationship(back_populates="sections")

    __table_args__ = (UniqueConstraint("standard_id", "name", name="uq_section_standard_name"),)
