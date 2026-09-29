import uuid

from pydantic import BaseModel, ConfigDict, EmailStr


class TeacherCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str | None = None
    max_periods_per_day: int = 5
    working_days: list[str] = []
    standard_ids: list[uuid.UUID] = []
    subject_ids: list[uuid.UUID] = []
    section_ids: list[uuid.UUID] = []


class TeacherUpdate(BaseModel):
    name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    max_periods_per_day: int | None = None
    working_days: list[str] | None = None
    standard_ids: list[uuid.UUID] | None = None
    subject_ids: list[uuid.UUID] | None = None
    section_ids: list[uuid.UUID] | None = None


class TeacherOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: str
    email: str
    phone: str | None
    max_periods_per_day: int
    working_days: list[str]
