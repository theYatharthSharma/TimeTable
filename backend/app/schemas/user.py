import uuid

from pydantic import BaseModel, ConfigDict, EmailStr

from app.models.user import UserRole


class UserBase(BaseModel):
    full_name: str
    email: EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class PrincipalCreate(UserBase):
    """Admin creates a principal for a specific school."""
    password: str
    school_id: uuid.UUID


class TeacherAccountCreate(UserBase):
    """Principal creates a teacher LOGIN linked to an existing Teacher profile."""
    password: str
    teacher_profile_id: uuid.UUID


class UserOut(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    role: UserRole
    is_active: bool
    school_id: uuid.UUID | None = None
    teacher_profile_id: uuid.UUID | None = None
