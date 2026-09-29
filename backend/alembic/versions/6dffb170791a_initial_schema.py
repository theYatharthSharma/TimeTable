"""initial schema

Revision ID: 6dffb170791a
Revises:
Create Date: 2026-09-28 15:36:08.904949

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = "6dffb170791a"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ============================================================
    # FEATURES
    # ============================================================

    op.create_table(
        "features",
        sa.Column("code", sa.String(length=64), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("description", sa.String(length=500), nullable=False),
        sa.Column("category", sa.String(length=50), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("code"),
    )

    # ============================================================
    # SCHOOLS
    #
    # IMPORTANT:
    # Do NOT create the created_by_admin_id -> users.id FK here.
    # users does not exist yet.
    # The FK is added later after users has been created.
    # ============================================================

    op.create_table(
        "schools",
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("academic_year", sa.String(length=20), nullable=False),
        sa.Column("working_days", sa.ARRAY(sa.String()), nullable=False),
        sa.Column("periods_per_day", sa.Integer(), nullable=False),
        sa.Column("period_duration_min", sa.Integer(), nullable=False),
        sa.Column("start_time", sa.String(length=5), nullable=False),
        sa.Column("created_by_admin_id", sa.UUID(), nullable=True),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    # ============================================================
    # TEACHERS
    # ============================================================

    op.create_table(
        "teachers",
        sa.Column("school_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("phone", sa.String(length=20), nullable=True),
        sa.Column("max_periods_per_day", sa.Integer(), nullable=False),
        sa.Column("working_days", sa.ARRAY(sa.String()), nullable=False),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["school_id"],
            ["schools.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    # ============================================================
    # USERS
    # ============================================================

    op.create_table(
        "users",
        sa.Column("full_name", sa.String(length=120), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column(
            "role",
            sa.Enum(
                "ADMIN",
                "PRINCIPAL",
                "TEACHER",
                name="user_role",
            ),
            nullable=False,
        ),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("school_id", sa.UUID(), nullable=True),
        sa.Column("teacher_profile_id", sa.UUID(), nullable=True),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["school_id"],
            ["schools.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["teacher_profile_id"],
            ["teachers.id"],
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("teacher_profile_id"),
    )

    op.create_index(
        op.f("ix_users_email"),
        "users",
        ["email"],
        unique=True,
    )

    # ============================================================
    # COMPLETE THE CIRCULAR RELATIONSHIP
    #
    # schools.created_by_admin_id -> users.id
    #
    # At this point both tables exist, so the FK can safely
    # be created.
    # ============================================================

    op.create_foreign_key(
        "fk_schools_created_by_admin_id_users",
        "schools",
        "users",
        ["created_by_admin_id"],
        ["id"],
        ondelete="SET NULL",
    )

    # ============================================================
    # AI CONSTRAINTS
    # ============================================================

    op.create_table(
        "ai_constraints",
        sa.Column("school_id", sa.UUID(), nullable=False),
        sa.Column("subject", sa.String(length=100), nullable=True),
        sa.Column("preference", sa.String(length=50), nullable=False),
        sa.Column("period", sa.String(length=100), nullable=True),
        sa.Column(
            "type",
            sa.Enum(
                "HARD",
                "SOFT",
                name="constraint_type",
            ),
            nullable=False,
        ),
        sa.Column("raw_text", sa.Text(), nullable=False),
        sa.Column("active", sa.Boolean(), nullable=False),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["school_id"],
            ["schools.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    # ============================================================
    # PERMISSION GRANTS
    # ============================================================

    op.create_table(
        "permission_grants",
        sa.Column("school_id", sa.UUID(), nullable=False),
        sa.Column("grantee_id", sa.UUID(), nullable=False),
        sa.Column("feature_code", sa.String(length=64), nullable=False),
        sa.Column("granted_by_id", sa.UUID(), nullable=True),
        sa.Column("parent_grant_id", sa.UUID(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column(
            "granted_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(
            ["feature_code"],
            ["features.code"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["granted_by_id"],
            ["users.id"],
            ondelete="SET NULL",
        ),
        sa.ForeignKeyConstraint(
            ["grantee_id"],
            ["users.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["parent_grant_id"],
            ["permission_grants.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["school_id"],
            ["schools.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_permission_grants_active_unique",
        "permission_grants",
        ["grantee_id", "feature_code"],
        unique=True,
        postgresql_where=sa.text("is_active = true"),
    )

    # ============================================================
    # STANDARDS
    # ============================================================

    op.create_table(
        "standards",
        sa.Column("school_id", sa.UUID(), nullable=False),
        sa.Column("level", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=50), nullable=False),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["school_id"],
            ["schools.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "school_id",
            "level",
            name="uq_standard_school_level",
        ),
    )

    # ============================================================
    # SUBJECTS
    # ============================================================

    op.create_table(
        "subjects",
        sa.Column("school_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("code", sa.String(length=20), nullable=False),
        sa.Column("weekly_periods", sa.Integer(), nullable=False),
        sa.Column("color_bg", sa.String(length=40), nullable=False),
        sa.Column("color_text", sa.String(length=40), nullable=False),
        sa.Column("color_border", sa.String(length=40), nullable=False),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["school_id"],
            ["schools.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "school_id",
            "code",
            name="uq_subject_school_code",
        ),
    )

    # ============================================================
    # TEACHER AVAILABILITIES
    # ============================================================

    op.create_table(
        "teacher_availabilities",
        sa.Column("teacher_id", sa.UUID(), nullable=False),
        sa.Column("max_periods_per_day", sa.Integer(), nullable=False),
        sa.Column(
            "schedule",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=False,
        ),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["teacher_id"],
            ["teachers.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("teacher_id"),
    )

    # ============================================================
    # SECTIONS
    # ============================================================

    op.create_table(
        "sections",
        sa.Column("school_id", sa.UUID(), nullable=False),
        sa.Column("standard_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=10), nullable=False),
        sa.Column("room_number", sa.String(length=20), nullable=True),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["school_id"],
            ["schools.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["standard_id"],
            ["standards.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "standard_id",
            "name",
            name="uq_section_standard_name",
        ),
    )

    # ============================================================
    # SUBJECT <-> STANDARD
    # ============================================================

    op.create_table(
        "subject_standards",
        sa.Column("subject_id", sa.UUID(), nullable=False),
        sa.Column("standard_id", sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(
            ["standard_id"],
            ["standards.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["subject_id"],
            ["subjects.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint(
            "subject_id",
            "standard_id",
        ),
    )

    # ============================================================
    # TEACHER <-> STANDARD
    # ============================================================

    op.create_table(
        "teacher_standards",
        sa.Column("teacher_id", sa.UUID(), nullable=False),
        sa.Column("standard_id", sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(
            ["standard_id"],
            ["standards.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["teacher_id"],
            ["teachers.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint(
            "teacher_id",
            "standard_id",
        ),
    )

    # ============================================================
    # TEACHER <-> SUBJECT
    # ============================================================

    op.create_table(
        "teacher_subjects",
        sa.Column("teacher_id", sa.UUID(), nullable=False),
        sa.Column("subject_id", sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(
            ["subject_id"],
            ["subjects.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["teacher_id"],
            ["teachers.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint(
            "teacher_id",
            "subject_id",
        ),
    )

    # ============================================================
    # TEACHER <-> SECTION
    # ============================================================

    op.create_table(
        "teacher_sections",
        sa.Column("teacher_id", sa.UUID(), nullable=False),
        sa.Column("section_id", sa.UUID(), nullable=False),
        sa.ForeignKeyConstraint(
            ["section_id"],
            ["sections.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["teacher_id"],
            ["teachers.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint(
            "teacher_id",
            "section_id",
        ),
    )

    # ============================================================
    # TIMETABLE ENTRIES
    # ============================================================

    op.create_table(
        "timetable_entries",
        sa.Column("school_id", sa.UUID(), nullable=False),
        sa.Column("standard_id", sa.UUID(), nullable=False),
        sa.Column("section_id", sa.UUID(), nullable=False),
        sa.Column(
            "day",
            sa.Enum(
                "MONDAY",
                "TUESDAY",
                "WEDNESDAY",
                "THURSDAY",
                "FRIDAY",
                "SATURDAY",
                name="day_of_week",
            ),
            nullable=False,
        ),
        sa.Column("period", sa.Integer(), nullable=False),
        sa.Column("subject_id", sa.UUID(), nullable=False),
        sa.Column("teacher_id", sa.UUID(), nullable=False),
        sa.Column("is_locked", sa.Boolean(), nullable=False),
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["school_id"],
            ["schools.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["section_id"],
            ["sections.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["standard_id"],
            ["standards.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["subject_id"],
            ["subjects.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["teacher_id"],
            ["teachers.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "section_id",
            "day",
            "period",
            name="uq_timetable_slot",
        ),
    )


def downgrade() -> None:
    # ============================================================
    # Remove the circular FK before dropping users/schools.
    # ============================================================

    op.drop_constraint(
        "fk_schools_created_by_admin_id_users",
        "schools",
        type_="foreignkey",
    )

    # ============================================================
    # Drop tables in reverse dependency order.
    # ============================================================

    op.drop_table("timetable_entries")
    op.drop_table("teacher_sections")
    op.drop_table("teacher_subjects")
    op.drop_table("teacher_standards")
    op.drop_table("subject_standards")
    op.drop_table("sections")
    op.drop_table("teacher_availabilities")
    op.drop_table("subjects")
    op.drop_table("standards")

    op.drop_index(
        "ix_permission_grants_active_unique",
        table_name="permission_grants",
        postgresql_where=sa.text("is_active = true"),
    )

    op.drop_table("permission_grants")
    op.drop_table("ai_constraints")

    op.drop_index(
        op.f("ix_users_email"),
        table_name="users",
    )

    op.drop_table("users")
    op.drop_table("teachers")
    op.drop_table("schools")
    op.drop_table("features")