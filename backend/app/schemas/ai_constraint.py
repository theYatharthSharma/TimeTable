import uuid

from pydantic import BaseModel, ConfigDict

from app.models.ai_constraint import ConstraintType


class AiConstraintOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    school_id: uuid.UUID
    subject: str | None
    preference: str
    period: str | None
    type: ConstraintType
    raw_text: str
    active: bool
