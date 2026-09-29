import uuid

from pydantic import BaseModel, ConfigDict


class SchoolCreate(BaseModel):
    name: str
    academic_year: str = "2026-27"
    working_days: list[str] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    periods_per_day: int = 6
    period_duration_min: int = 45
    start_time: str = "08:00"


class SchoolUpdate(BaseModel):
    name: str | None = None
    academic_year: str | None = None
    working_days: list[str] | None = None
    periods_per_day: int | None = None
    period_duration_min: int | None = None
    start_time: str | None = None


class SchoolOut(SchoolCreate):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
