import uuid

from sqlalchemy import ARRAY, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base, TimestampMixin, UUIDPKMixin


class Teacher(UUIDPKMixin, TimestampMixin, Base):
    """
    The staff profile. A Teacher row can exist before its login (User)
    account is created — e.g. a principal first adds the profile, then
    invites the teacher, which creates a User with teacher_profile_id
    pointing back here.
    """
    __tablename__ = "teachers"

    school_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("schools.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    max_periods_per_day: Mapped[int] = mapped_column(Integer, default=5)
    working_days: Mapped[list[str]] = mapped_column(ARRAY(String), default=list)

    standard_ids: Mapped[list["TeacherStandard"]] = relationship(cascade="all, delete-orphan")
    subject_ids: Mapped[list["TeacherSubject"]] = relationship(cascade="all, delete-orphan")
    section_ids: Mapped[list["TeacherSection"]] = relationship(cascade="all, delete-orphan")

    user_account: Mapped["User"] = relationship(back_populates="teacher_profile", uselist=False)


class TeacherStandard(Base):
    __tablename__ = "teacher_standards"
    teacher_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("teachers.id", ondelete="CASCADE"), primary_key=True)
    standard_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("standards.id", ondelete="CASCADE"), primary_key=True)


class TeacherSubject(Base):
    __tablename__ = "teacher_subjects"
    teacher_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("teachers.id", ondelete="CASCADE"), primary_key=True)
    subject_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("subjects.id", ondelete="CASCADE"), primary_key=True)


class TeacherSection(Base):
    __tablename__ = "teacher_sections"
    teacher_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("teachers.id", ondelete="CASCADE"), primary_key=True)
    section_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("sections.id", ondelete="CASCADE"), primary_key=True)
