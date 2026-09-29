import enum
import uuid

from sqlalchemy import Boolean, Enum, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base, TimestampMixin, UUIDPKMixin


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    PRINCIPAL = "principal"
    TEACHER = "teacher"


class User(UUIDPKMixin, TimestampMixin, Base):
    __tablename__ = "users"

    full_name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole, name="user_role"), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # NULL for admin (admin is not scoped to a school). Required for
    # principal/teacher — enforced in the service layer at creation time.
    school_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("schools.id", ondelete="CASCADE"), nullable=True
    )

    # Set only when role == teacher; links the login account to the
    # richer Teacher profile (subjects, sections, workload, etc.)
    teacher_profile_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("teachers.id", ondelete="SET NULL"), nullable=True, unique=True
    )

    school: Mapped["School"] = relationship(back_populates="users", foreign_keys=[school_id])
    teacher_profile: Mapped["Teacher"] = relationship(
        back_populates="user_account", foreign_keys=[teacher_profile_id]
    )
