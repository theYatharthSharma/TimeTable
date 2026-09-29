import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class GrantCreate(BaseModel):
    """Body for both admin->principal and principal->teacher grant endpoints."""
    grantee_id: uuid.UUID
    feature_code: str


class GrantOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    school_id: uuid.UUID
    grantee_id: uuid.UUID
    feature_code: str
    granted_by_id: uuid.UUID | None
    parent_grant_id: uuid.UUID | None
    is_active: bool
    granted_at: datetime
    revoked_at: datetime | None
