# 📅 TimeGen AI

> **AI-assisted School Timetable Management & Scheduling Platform**

TimeGen AI is a full-stack web application designed to simplify timetable management for schools and educational institutions.

The platform provides a centralized system for managing **schools, academic structures, subjects, teachers, teacher availability, timetable constraints, permissions, and timetable operations** through a modern web interface.

The project is being developed with an extensible architecture so that intelligent timetable generation and additional AI-powered scheduling capabilities can be integrated as the project evolves.

---

## ✨ Features

### 🔐 Authentication & Authorization

* JWT-based authentication
* Role-based access control
* Three-level permission hierarchy:

  * **Admin**
  * **Principal**
  * **Teacher**
* Secure password hashing
* Feature-level permissions
* Permission delegation from Principal → Teacher
* Cascading permission revocation

### 👨‍💼 Admin

The Admin acts as the global platform operator.

* Manage schools
* Create and manage principals
* Manage platform features
* Grant features to principals
* Revoke permissions
* Manage academic configuration
* Control access to timetable-related functionality

### 🏫 Principal

Principals are scoped to their respective school.

* Manage academic structure
* Manage subjects
* Manage teachers
* Manage teacher availability
* Configure timetable constraints
* Delegate permitted features to teachers
* Manage school-level timetable data

A Principal can only delegate permissions that have already been granted to them by an Admin.

### 👨‍🏫 Teacher

Teachers have access to functionality delegated to them by the Principal.

* View their assigned information
* Manage their own availability
* Access permitted timetable functionality
* Work within the permissions assigned to their account

### 📚 Academic Management

The platform provides functionality for managing:

* Schools
* Classes / sections
* Subjects
* Teachers
* Teacher availability
* Academic configuration
* Timetable constraints

### 🧠 AI & Timetable Generation

The architecture is designed around intelligent timetable generation.

The planned scheduling engine will consider constraints such as:

* Teacher availability
* Subject requirements
* Class/section schedules
* Period availability
* Teacher conflicts
* Timetable constraints

> **Current status:** The timetable generation endpoint and permission layer are present, but the complete constraint-solving generation engine is still under development.

### 📊 Timetable Management

The current system supports timetable-related operations including:

* Timetable viewing
* Manual timetable editing
* Conflict validation
* Teacher availability checks
* Permission-controlled timetable operations

---

# 🏗️ Architecture

```text
                         ┌─────────────────────────┐
                         │       React + TS         │
                         │       Frontend           │
                         │                         │
                         │  Dashboard              │
                         │  Teachers               │
                         │  Subjects               │
                         │  Classes / Sections     │
                         │  Availability           │
                         │  Timetable              │
                         │  Settings               │
                         └────────────┬────────────┘
                                      │
                                  REST API
                                      │
                                      ▼
                         ┌─────────────────────────┐
                         │        FastAPI           │
                         │        Backend           │
                         │                         │
                         │ Authentication           │
                         │ Authorization            │
                         │ API Routes               │
                         │ Business Services        │
                         │ Timetable Services       │
                         └────────────┬────────────┘
                                      │
                         ┌────────────┴────────────┐
                         │                         │
                         ▼                         ▼
                ┌─────────────────┐       ┌─────────────────┐
                │   PostgreSQL    │       │ Alembic         │
                │    Database     │       │ Migrations      │
                └─────────────────┘       └─────────────────┘
```

---

# 🛠️ Tech Stack

## Frontend

| Technology       | Purpose                                 |
| ---------------- | --------------------------------------- |
| React            | UI framework                            |
| TypeScript       | Type-safe development                   |
| Vite             | Frontend tooling and development server |
| Tailwind CSS     | UI styling                              |
| Lucide React     | Icons                                   |
| Motion           | UI animations                           |
| Google GenAI SDK | AI integration layer                    |

The frontend is configured to run through Vite on port `3000`.

## Backend

| Technology        | Purpose                  |
| ----------------- | ------------------------ |
| Python            | Backend language         |
| FastAPI           | REST API framework       |
| Uvicorn           | ASGI server              |
| SQLAlchemy        | ORM                      |
| PostgreSQL        | Relational database      |
| AsyncPG           | Async PostgreSQL driver  |
| Alembic           | Database migrations      |
| Pydantic          | Data validation          |
| Pydantic Settings | Configuration management |
| Passlib + bcrypt  | Password hashing         |
| Python-JOSE       | JWT authentication       |

The backend dependency versions are pinned in `backend/requirements.txt`.

---

# 📂 Project Structure

```text
TimeTable/
│
├── backend/
│   │
│   ├── alembic/
│   │   └── versions/
│   │
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       └── endpoints/
│   │   │
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── permissions.py
│   │   │   └── security.py
│   │   │
│   │   ├── db/
│   │   │   ├── base.py
│   │   │   ├── session.py
│   │   │   └── init_db.py
│   │   │
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── main.py
│   │
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   │
│   ├── src/
│   │   ├── components/
│   │   ├── data/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── main.tsx
│   │
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.ts
│   └── .env.example
│
└── .gitignore
```

---

# 🚀 Getting Started

## Prerequisites

Make sure the following are installed:

* **Python 3.12**
* **Node.js**
* **npm**
* **PostgreSQL**
* **Git**

Docker can also be used for the backend/database setup.

---

# ⚙️ Backend Setup

Navigate to the backend:

```bash
cd backend
```

### 1. Create a virtual environment

### Windows

```powershell
python -m venv .venv
```

Activate it:

```powershell
.venv\Scripts\activate
```

### macOS / Linux

```bash
python3.12 -m venv .venv
source .venv/bin/activate
```

---

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

---

### 3. Configure environment variables

Create your local `.env` file from the provided example:

```bash
copy .env.example .env
```

On macOS/Linux:

```bash
cp .env.example .env
```

Configure the required values, including:

```env
DATABASE_URL=your_postgresql_connection_string
SECRET_KEY=your_secret_key
```

**Never commit your `.env` file to GitHub.**

---

### 4. Initialize the database

```bash
python -m app.db.init_db
```

This initializes the database tables and seeds the required platform configuration.

---

### 5. Start the backend

```bash
uvicorn app.main:app --reload
```

The backend will normally be available at:

```text
http://127.0.0.1:8000
```

### API Documentation

FastAPI automatically provides interactive API documentation:

```text
http://127.0.0.1:8000/docs
```

and:

```text
http://127.0.0.1:8000/redoc
```

---

# 💻 Frontend Setup

Open a second terminal.

From the project root:

```bash
cd frontend
```

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create the local environment file using the provided example.

Configure the backend API URL according to your local setup.

For example:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

### 3. Start the development server

```bash
npm run dev
```

The frontend is configured to run on:

```text
http://localhost:3000
```

The available frontend scripts include development, production build, preview, and TypeScript checking.

---

# 🐳 Docker Setup

The backend contains Docker configuration for running the API together with PostgreSQL.

From the backend directory:

```bash
docker compose up --build
```

This starts the backend services defined in `docker-compose.yml`.

For local development without Docker, follow the standard Python + PostgreSQL setup described above.

---

# 🔑 Permission Architecture

One of the core parts of TimeGen AI is its hierarchical permission system.

```text
Admin
  │
  │ grants
  ▼
Principal
  │
  │ delegates subset
  ▼
Teacher
```

### Admin

Global platform operator with access to all available features.

### Principal

* Belongs to one school
* Can only use features granted by an Admin
* Can delegate a subset of those features to teachers

### Teacher

* Cannot grant permissions
* Can use features delegated by their Principal
* Can manage their own availability independently

Permissions are enforced at the backend service/API level rather than relying solely on frontend restrictions.

---

# 🔌 API Overview

The backend exposes REST APIs for the major platform resources.

Examples include:

```text
/admin/schools
/admin/principals
/admin/permissions/grant
/admin/permissions/{id}/revoke

/principal/permissions/available
/principal/teacher-accounts
/principal/permissions/grant

/subjects
/teachers
/academic/*
/settings
/ai-constraints

/availability/{teacher_id}

/timetable/generate
```

The complete interactive API specification is available through Swagger once the backend is running:

```text
http://127.0.0.1:8000/docs
```

---

# 🧠 Timetable Generation Roadmap

The scheduling engine is being developed as a dedicated service rather than mixing scheduling logic into the API layer.

The planned engine will work with:

```text
Teacher Data
      │
      ├── Availability
      │
      ├── Subjects
      │
      ├── Classes / Sections
      │
      └── Constraints
              │
              ▼
       Scheduling Engine
              │
              ▼
       Generated Timetable
              │
              ▼
        Conflict Validation
              │
              ▼
        Timetable Interface
```

Future scheduling capabilities can include:

* Automatic timetable generation
* Hard constraint validation
* Teacher conflict detection
* Class/section conflict detection
* Teacher workload balancing
* Availability-aware scheduling
* Optimization of timetable quality
* AI-assisted scheduling recommendations

---

# 🗺️ Roadmap

### Phase 1 — Core Platform

* [x] Authentication
* [x] Role-based access
* [x] Hierarchical permissions
* [x] School management
* [x] Teacher management
* [x] Subject management
* [x] Academic structure
* [x] Teacher availability
* [x] Timetable viewing
* [x] Manual timetable editing

### Phase 2 — Scheduling Engine

* [ ] Complete automatic timetable generation
* [ ] Constraint-solving engine
* [ ] Teacher conflict resolution
* [ ] Section conflict resolution
* [ ] Availability-aware scheduling
* [ ] Timetable optimization

### Phase 3 — AI Integration

* [ ] AI-assisted timetable recommendations
* [ ] Natural-language scheduling constraints
* [ ] Intelligent conflict explanations
* [ ] Schedule quality analysis
* [ ] AI timetable improvement suggestions

### Phase 4 — Production Features

* [ ] Timetable export
* [ ] Notifications
* [ ] Audit logs
* [ ] Advanced reporting
* [ ] Production deployment
* [ ] Automated testing
* [ ] Monitoring and analytics

---

# 🔒 Security

The project uses several security mechanisms:

* JWT authentication
* Password hashing
* Role-based authorization
* Feature-level authorization
* Backend permission enforcement
* Environment-based secret management
* PostgreSQL-backed access control

### Important

Never commit:

```text
.env
.env.local
API keys
database passwords
JWT secrets
private credentials
```

Use `.env.example` files to document required configuration without exposing secrets.

---

# 🧪 Development

Before committing changes, check the application locally.

### Frontend

```bash
npm run lint
```

Build the production frontend:

```bash
npm run build
```

### Backend

Start the development server:

```bash
uvicorn app.main:app --reload
```

Then verify the API through:

```text
http://127.0.0.1:8000/docs
```

---

# 🤝 Contributing

Contributions and improvements are welcome.

A typical workflow is:

```bash
git checkout -b feature/your-feature

git add .

git commit -m "Add your feature"

git push origin feature/your-feature
```

Then open a Pull Request on GitHub.

---

# 📌 Current Project Status

**Status:** 🚧 Active Development

TimeGen AI currently provides the foundation for a school timetable management platform, including its frontend interface, FastAPI backend, database layer, authentication, role hierarchy, permission delegation, academic management, teacher availability, and timetable operations.

The **full automatic timetable-generation engine is still under development** and should not be considered production-ready at this stage.

---

# 👨‍💻 Project

**Repository:**
[theYatharthSharma/TimeTable](https://github.com/theYatharthSharma/TimeTable?utm_source=chatgpt.com)

**Project:** TimeGen AI
**Domain:** School Timetable Management
**Architecture:** Full-Stack Web Application
**Backend:** FastAPI + PostgreSQL
**Frontend:** React + TypeScript + Vite
**Status:** Active Development
