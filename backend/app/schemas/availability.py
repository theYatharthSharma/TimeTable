import uuid

from pydantic import BaseModel, ConfigDict


class AvailabilityUpdate(BaseModel):
    schedule: dict[str, dict[str, bool]]
    max_periods_per_day: int | None = None


class AvailabilityOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    teacher_id: uuid.UUID
    max_periods_per_day: int
    schedule: dict
