"""
Import every ORM model here so Alembic autogenerate and
`Base.metadata.create_all` can discover them from a single entry point.
"""
from app.db.base_class import Base  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.school import School  # noqa: F401
from app.models.feature import Feature  # noqa: F401
from app.models.permission_grant import PermissionGrant  # noqa: F401
from app.models.academic import Standard, Section  # noqa: F401
from app.models.subject import Subject  # noqa: F401
from app.models.teacher import Teacher  # noqa: F401
from app.models.availability import TeacherAvailability  # noqa: F401
from app.models.timetable import TimetableEntry  # noqa: F401
from app.models.ai_constraint import AiConstraint  # noqa: F401
