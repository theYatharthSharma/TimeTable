import uuid

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class TeacherCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str | None = None
    max_periods_per_day: int = 5
    working_days: list[str] = Field(default_factory=list)
    standard_ids: list[uuid.UUID] = Field(default_factory=list)
    subject_ids: list[uuid.UUID] = Field(default_factory=list)
    section_ids: list[uuid.UUID] = Field(default_factory=list)


class TeacherUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    max_periods_per_day: int | None = None
    working_days: list[str] | None = None
    standard_ids: list[uuid.UUID] | None = None
    subject_ids: list[uuid.UUID] | None = None
    section_ids: list[uuid.UUID] | None = None

from pydantic import Field

class TeacherOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: str
    email: str
    phone: str | None
    max_periods_per_day: int
    working_days: list[str]
    standard_ids: list[uuid.UUID] = Field(default_factory=list)
    subject_ids: list[uuid.UUID] = Field(default_factory=list)
    section_ids: list[uuid.UUID] = Field(default_factory=list)

from pydantic import Field

class AdminTeacherCreate(TeacherCreate):
    """Admin creates a teacher profile and login in one request."""

    school_id: uuid.UUID
    password: str = Field(min_length=8, max_length=72)