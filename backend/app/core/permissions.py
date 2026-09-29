"""
The feature catalog that permissions are granted against, plus the
delegation rules for the three roles in the system:

    admin (master operator)
        -> can grant/revoke ANY feature to a "principal", scoped to a school.
        -> implicitly has every feature everywhere (no grant row needed).

    principal
        -> can grant/revoke a feature to a "teacher" in THEIR OWN school,
           but only if the principal currently holds an active grant for
           that exact feature themselves. A principal can never delegate
           a feature they don't (or no longer) have.

    teacher
        -> is always the leaf of the delegation chain. Cannot grant
           anything to anyone.

Every non-admin feature check is therefore just: "does an active
PermissionGrant row exist for (user, feature, school)?"
"""
from enum import Enum


class FeatureCode(str, Enum):
    MANAGE_SCHOOL_SETTINGS = "manage_school_settings"
    MANAGE_ACADEMIC_STRUCTURE = "manage_academic_structure"  # standards & sections
    MANAGE_SUBJECTS = "manage_subjects"
    MANAGE_TEACHERS = "manage_teachers"
    MANAGE_TEACHER_AVAILABILITY = "manage_teacher_availability"  # edit OTHER teachers' availability
    MANAGE_AI_CONSTRAINTS = "manage_ai_constraints"
    GENERATE_TIMETABLE = "generate_timetable"
    EDIT_TIMETABLE = "edit_timetable"
    VIEW_REPORTS = "view_reports"


# (code, display name, description, category) — seeded into the `features`
# table on first boot by app.db.init_db. Admin can add more later via the
# admin API; this list only defines what ships out of the box.
DEFAULT_FEATURES: list[tuple[FeatureCode, str, str, str]] = [
    (
        FeatureCode.MANAGE_SCHOOL_SETTINGS,
        "Manage School Settings",
        "Edit academic year, working days, period timings.",
        "administration",
    ),
    (
        FeatureCode.MANAGE_ACADEMIC_STRUCTURE,
        "Manage Standards & Sections",
        "Create/edit standards (grades) and their sections.",
        "academics",
    ),
    (
        FeatureCode.MANAGE_SUBJECTS,
        "Manage Subjects",
        "Create/edit subjects and their weekly period counts.",
        "academics",
    ),
    (
        FeatureCode.MANAGE_TEACHERS,
        "Manage Teachers",
        "Create/edit teacher profiles and their subject/section assignments.",
        "staff",
    ),
    (
        FeatureCode.MANAGE_TEACHER_AVAILABILITY,
        "Manage Teacher Availability",
        "Edit availability grids for teachers other than yourself.",
        "staff",
    ),
    (
        FeatureCode.MANAGE_AI_CONSTRAINTS,
        "Manage AI Constraints",
        "Add/edit natural-language scheduling preferences for the AI generator.",
        "timetable",
    ),
    (
        FeatureCode.GENERATE_TIMETABLE,
        "Generate Timetable",
        "Run the AI/rule-based timetable generation & regeneration engine.",
        "timetable",
    ),
    (
        FeatureCode.EDIT_TIMETABLE,
        "Edit Timetable",
        "Manually edit individual timetable slots after generation.",
        "timetable",
    ),
    (
        FeatureCode.VIEW_REPORTS,
        "View Reports & Dashboard",
        "Access aggregate dashboards, conflict reports, and workload stats.",
        "reports",
    ),
]

DEFAULT_FEATURE_CODES: set[str] = {code.value for code, *_ in DEFAULT_FEATURES}
