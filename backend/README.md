# TimeGen AI — Backend

FastAPI + PostgreSQL backend for the TimeGen AI school-timetabling app,
implementing the requested permission hierarchy:

```
admin (master operator)
  └─ grants features to  →  principal   (scoped to one school)
                              └─ grants a SUBSET of what they hold →  teacher
```

Live-tested end-to-end against a real PostgreSQL 16 instance (see
"How it was verified" below) — this isn't just type-checked, it runs.

## The permission model

- **Admin** is a global master operator (not tied to a school) and
  implicitly has every feature everywhere — no grant row needed.
- **Principal** belongs to exactly one school and can only *use* a
  feature, or *delegate* it to a teacher in their own school, if an
  admin has granted it to them first.
- **Teacher** is the leaf of the chain — can use delegated features,
  can never grant anything.
- A principal **cannot delegate a feature they don't currently hold**.
  This is enforced in the service layer (`app/services/permission_service.py`),
  not just the UI.
- **Revoking cascades.** Pull a principal's grant and every grant they
  delegated from it is revoked automatically (`PermissionGrant.parent_grant_id`
  is what makes the cascade possible).

Everything hangs off one table, `permission_grants`:

| column | meaning |
|---|---|
| `grantee_id` | who can use the feature |
| `feature_code` | which feature (`manage_subjects`, `generate_timetable`, ...) |
| `granted_by_id` | who granted it |
| `parent_grant_id` | NULL for admin→principal (root); the principal's own grant row for principal→teacher |
| `is_active` / `revoked_at` | current status |

Only one *active* grant may exist per `(grantee, feature)` — enforced by
a Postgres partial unique index, so a feature can be granted, revoked,
and re-granted over time without violating uniqueness on history.

The feature catalog (`features` table) ships seeded with 9 features
covering every admin-gated action in the frontend — school settings,
academic structure, subjects, teachers, teacher availability (for
editing *someone else's*), AI constraints, timetable generation, manual
timetable edits, and reports. Admin can add more via `POST /admin/features`
without a code change.

A teacher can always view/edit **their own** availability — that's
ordinary self-service, not gated behind a grant. Editing *another*
teacher's availability requires `manage_teacher_availability`.

## Project layout

```
app/
  core/        config, JWT + password hashing, the FeatureCode catalog
  db/          SQLAlchemy engine/session, model registry, bootstrap/seed script
  models/      SQLAlchemy 2.0 ORM models (async)
  schemas/     Pydantic request/response models
  services/    permission_service.py — grant/revoke/cascade business rules
  api/
    deps.py           get_current_user, require_role(...), require_feature(...)
    v1/endpoints/      one router per resource
alembic/       migration scaffolding (env.py wired for async SQLAlchemy)
```

## Setup

```bash
cp .env.example .env        # edit SECRET_KEY and FIRST_ADMIN_PASSWORD at minimum
docker compose up --build   # starts Postgres + the API on :8000
```

Or locally without Docker:

```bash
python3.12 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
# point .env at a running Postgres, then:
python -m app.db.init_db     # creates tables, seeds features + first admin
uvicorn app.main:app --reload
```

Swagger UI: `http://localhost:8000/docs`

> **Note on bcrypt:** this project pins `bcrypt==4.0.1` alongside
> `passlib[bcrypt]==1.7.4` — newer bcrypt (4.1+) removed an attribute
> passlib 1.7.4 reads at import time and password hashing breaks
> silently otherwise. Confirmed while testing this build.

## Key endpoints

| Who | Endpoint | What |
|---|---|---|
| admin | `POST /admin/schools` | onboard a school |
| admin | `POST /admin/principals` | create a principal for a school |
| admin | `POST /admin/permissions/grant` | grant a feature to a principal |
| admin | `POST /admin/permissions/{id}/revoke` | revoke (cascades to any teacher it was delegated to) |
| principal | `GET /principal/permissions/available` | features this principal currently holds and can delegate |
| principal | `POST /principal/teacher-accounts` | create a login for an existing Teacher profile |
| principal | `POST /principal/permissions/grant` | delegate a held feature to a teacher in their school |
| any (gated) | `/subjects`, `/teachers`, `/academic/*`, `/settings`, `/ai-constraints` | domain CRUD, each gated by `require_feature(...)` |
| any | `/availability/{teacher_id}` | self-service for own record; needs `manage_teacher_availability` for others |
| gated | `POST /timetable/generate` | placeholder — see note below |

Domain endpoints take a `school_id` query param for admin (who has no
home school); principals/teachers are auto-scoped to their own.

## What's stubbed, not built

`POST /timetable/generate` enforces the `generate_timetable` permission
but returns `501` — the actual constraint-solving engine (mirroring the
frontend's `timetableService.generateTimetable`) is real algorithmic
work distinct from the permission system this task asked for, and
belongs in a dedicated `app/services/timetable_generation_service.py`.
`PUT /timetable/{section}/{day}/{period}` (manual slot edits, with
double-booking + availability conflict checks) is fully implemented.

Alembic is wired (`alembic/env.py` targets the async engine and every
model) but no migration has been generated yet — run
`alembic revision --autogenerate -m "init"` once you're ready to move
off `init_db.py`'s `create_all` for schema management.

## How it was verified

Ran live against a real PostgreSQL 16 instance:
1. Bootstrapped tables + seeded 9 features + first admin — confirmed via `psql`.
2. Admin created a school and a principal.
3. Principal blocked (`403`) from creating a subject with no grant.
4. Admin granted `manage_subjects` → principal succeeded (`201`).
5. Principal blocked from delegating `manage_ai_constraints` to a
   teacher — correctly rejected because the principal doesn't hold it.
6. Principal delegated `manage_subjects` (which it does hold) to a
   teacher; the resulting grant's `parent_grant_id` correctly pointed
   at the admin's original grant row.
7. Teacher used the delegated permission successfully (`201`).
8. Admin revoked the root grant from the principal (`204`).
9. **Both** the principal and the teacher immediately lost the
   permission (`403`/`403`) — confirmed the cascade revoke in
   `permission_grants` left both rows `is_active=false` with
   `revoked_at` set and the parent/child link intact.
