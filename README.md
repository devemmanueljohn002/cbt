# Championship Platform

A Next.js 14 frontend connected to a Python FastAPI backend and SQLite database.

## Architecture

- Frontend: Next.js 14, React 18, TypeScript and Tailwind CSS.
- Backend: Python 3.13+, FastAPI and SQLAlchemy 2.x.
- Database: SQLite for the initial deployment.
- Migrations: Alembic.
- Authentication: HTTP-only `sid` cookie, SHA-256 hashed session identifiers, seven-day sessions and bcrypt password hashes.

The browser continues to call the existing `/api/...` URLs. Next.js forwards those requests to FastAPI using `FASTAPI_BASE_URL`. Server-rendered pages also query FastAPI and forward the incoming session cookie.

## Requirements

- Node.js 20 or newer.
- Python 3.13 or newer.

## Backend setup (Windows PowerShell)

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `backend/.env`. Set `DATABASE_URL=sqlite:///./data/championship.db`, `ADMIN_LOGIN`, and a strong `ADMIN_PASSWORD` (at least 12 characters). Keep this file private.

### Fresh installation (no existing PostgreSQL data to import)

```powershell
alembic upgrade head
python -m app.db.seed
```

### Migrating existing PostgreSQL data

Do **not** run the seed command before importing, because the importer intentionally refuses to merge into a non-empty SQLite database. Follow `docs/DATABASE_MIGRATION.md`: create the schema, run the dry run, verify the old database counts, then run the importer with `--apply`. Run the seed command after import if you need to create any missing initial admin/class/subject records.

Start the backend:

```powershell
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

API health: http://127.0.0.1:8000/healthz
Interactive API documentation: http://127.0.0.1:8000/docs

## Frontend setup

Open a second PowerShell terminal at the project root:

```powershell
npm install
```

Set the following in the root `.env` (do not overwrite an existing `.env`; add/update the values):

```dotenv
FASTAPI_BASE_URL=http://127.0.0.1:8000
SESSION_COOKIE_NAME=sid
```

Then start Next.js:

```powershell
npm run dev
```

Open http://localhost:3000.

## Running tests

From `backend/` with the virtual environment activated:

```powershell
python -m pytest -q
```

From the project root:

```powershell
npm run typecheck
npm run build
```

## Existing PostgreSQL data

The original Prisma schema and SQL migration are retained as migration references. If the old PostgreSQL database is accessible, set `LEGACY_DATABASE_URL` in `backend/.env` (never commit or share this value). First create the SQLite schema with `alembic upgrade head`, then run a dry run:

```powershell
python scripts/migrate_postgres_to_sqlite.py
```

The dry run prints source row counts only. It does not import data.

Only after checking the source counts and confirming the target SQLite database is empty should you run:

```powershell
python scripts/migrate_postgres_to_sqlite.py --apply
```

The importer preserves existing IDs and relationships and refuses to merge into non-empty target tables. If the old database is unavailable, no old records can be copied; keep a secure database backup and run the importer later when access is restored.

## Security notes

- Passwords are hashed with bcrypt at cost 12. Existing bcrypt password hashes can be verified without resetting user passwords.
- Only a SHA-256 digest of the random session cookie token is stored in SQLite.
- Session cookies are HTTP-only, SameSite=Lax and Secure in production. Keep the frontend and backend `SESSION_COOKIE_NAME` values aligned (`sid` by default).
- Admin and teacher/student routes enforce server-side role checks.
- Student-facing examination responses never include `QuestionOption.isCorrect` or answer explanations.
- Examination scoring is calculated on the server, not trusted from the browser.
- Pausing an examination freezes the schedule and active session deadlines; resuming extends them by the pause duration.
- CSV export neutralizes spreadsheet formula prefixes.
- SQLite is suitable for local development and modest initial workloads. For high-concurrency production competitions, plan a managed PostgreSQL deployment after validating the workload; SQLAlchemy supports that transition.

## Scope note

The supplied repository was a Phase 1 scaffold. This migration restores the student management handlers that were present as misplaced source files, adds endpoints needed by the included UI, and builds the examination/session/leaderboard backend around the schema. The original schema supports option-based answers; typed free-text numeric/expression marking needs an explicit `StudentAnswer` schema extension before it can be safely enabled.
