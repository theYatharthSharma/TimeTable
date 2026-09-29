from pydantic import BaseModel, ConfigDict


class FeatureCreate(BaseModel):
    code: str
    name: str
    description: str = ""
    category: str = "general"


class FeatureOut(FeatureCreate):
    model_config = ConfigDict(from_attributes=True)
    is_active: bool
