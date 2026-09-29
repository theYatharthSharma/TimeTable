import uuid

from pydantic import BaseModel, ConfigDict


class SubjectCreate(BaseModel):
    name: str
    code: str
    weekly_periods: int = 1
    standard_ids: list[uuid.UUID] = []


class SubjectUpdate(BaseModel):
    name: str | None = None
    code: str | None = None
    weekly_periods: int | None = None
    standard_ids: list[uuid.UUID] | None = None


class SubjectOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: str
    code: str
    weekly_periods: int
    color_bg: str
    color_text: str
    color_border: str
