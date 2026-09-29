import uuid

from pydantic import BaseModel, ConfigDict

from app.models.timetable import DayOfWeek


class TimetableEntryUpdate(BaseModel):
    subject_id: uuid.UUID
    teacher_id: uuid.UUID


class TimetableEntryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    standard_id: uuid.UUID
    section_id: uuid.UUID
    day: DayOfWeek
    period: int
    subject_id: uuid.UUID
    teacher_id: uuid.UUID
    is_locked: bool


class GenerationConfig(BaseModel):
    scope: str  # 'entire_school' | 'standard' | 'section'
    target_standard_id: uuid.UUID | None = None
    target_section_id: uuid.UUID | None = None
