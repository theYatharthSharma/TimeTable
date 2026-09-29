"""
PermissionGrant is the single table that implements the whole
admin -> principal -> teacher delegation chain.

Each row says: "`grantee` may use `feature_code` inside `school`, because
`granted_by` gave it to them." `parent_grant_id` points at the grant the
*granter* was themselves relying on when they delegated it — this is what
lets a revoke cascade down the chain (see app.services.permission_service).

    Admin  -> Principal  : parent_grant_id IS NULL   (root grant)
    Principal -> Teacher : parent_grant_id = <the principal's own grant row>

Only one ACTIVE grant may exist per (grantee, feature). This is enforced
by a Postgres partial unique index rather than a plain UniqueConstraint,
so the same feature can be granted, revoked, and re-granted to the same
person over time without violating uniqueness on the historical rows.
"""
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Index, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base_class import Base, UUIDPKMixin


class PermissionGrant(UUIDPKMixin, Base):
    __tablename__ = "permission_grants"

    school_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("schools.id", ondelete="CASCADE"), nullable=False
    )
    grantee_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    feature_code: Mapped[str] = mapped_column(
        String(64), ForeignKey("features.code", ondelete="CASCADE"), nullable=False
    )
    granted_by_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    parent_grant_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("permission_grants.id", ondelete="CASCADE"), nullable=True
    )

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    granted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=text("now()"))
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    grantee: Mapped["User"] = relationship(foreign_keys=[grantee_id])
    granted_by: Mapped["User"] = relationship(foreign_keys=[granted_by_id])

    # Self-referential delegation chain: parent -> the grant the granter
    # relied on; children -> grants this row was used to delegate further.
    parent_grant: Mapped["PermissionGrant | None"] = relationship(
        remote_side="PermissionGrant.id", back_populates="child_grants"
    )
    child_grants: Mapped[list["PermissionGrant"]] = relationship(
        back_populates="parent_grant"
    )

    __table_args__ = (
        # Only one *active* grant per (grantee, feature) at a time.
        Index(
            "ix_permission_grants_active_unique",
            "grantee_id",
            "feature_code",
            unique=True,
            postgresql_where=text("is_active = true"),
        ),
    )
