import uuid

from pydantic import BaseModel, ConfigDict


class StandardCreate(BaseModel):
    level: int
    name: str | None = None


class StandardOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    level: int
    name: str


class SectionCreate(BaseModel):
    standard_id: uuid.UUID
    name: str
    room_number: str | None = None


class SectionUpdate(BaseModel):
    name: str | None = None
    room_number: str | None = None
    assigned_subject_ids: list[uuid.UUID] | None = None
    assigned_teacher_ids: list[uuid.UUID] | None = None


class SectionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    standard_id: uuid.UUID
    name: str
    room_number: str | None
