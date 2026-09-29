from fastapi import APIRouter

from app.api.v1.endpoints import (
    academic,
    admin,
    ai_constraints,
    auth,
    availability,
    principal,
    settings,
    subjects,
    teachers,
    timetable,
)

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(admin.router)
api_router.include_router(principal.router)
api_router.include_router(settings.router)
api_router.include_router(academic.router)
api_router.include_router(subjects.router)
api_router.include_router(teachers.router)
api_router.include_router(availability.router)
api_router.include_router(timetable.router)
api_router.include_router(ai_constraints.router)
