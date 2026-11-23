# Database Migration: PostgreSQL to SQLite

## Important

The supplied project archive did not include a database dump or the private `.env` file. The old PostgreSQL database has therefore not been connected to or copied. Do not assume the SQLite database contains your previous users, students, questions, examinations or results until an import has been run and verified.

## 1. Prepare SQLite

From PowerShell:

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
Copy-Item .env.example .env
```

Edit `backend/.env`. Set `DATABASE_URL=sqlite:///./data/championship.db`, `ADMIN_LOGIN`, and a strong `ADMIN_PASSWORD`. Keep this file private.

Then:

```powershell
alembic upgrade head
```

## 2. Check the old PostgreSQL source

If the old `DATABASE_URL` points to a reachable PostgreSQL server, copy its value privately into `LEGACY_DATABASE_URL` in `backend/.env`. Do not paste it into chat, documentation or source control.

Install the backend requirements so the PostgreSQL driver is available:

```powershell
python -m pip install -r requirements.txt
```

Run a dry run:

```powershell
python scripts/migrate_postgres_to_sqlite.py
```

The dry run prints source row counts only. It does not import data.

## 3. Import into an empty SQLite database

Before importing, create a separate backup of any SQLite database that already contains data. The importer intentionally refuses to merge into non-empty target tables.

When the source counts and target state are verified:

```powershell
python scripts/migrate_postgres_to_sqlite.py --apply
```

The script copies rows in foreign-key dependency order and preserves primary keys, relationships, bcrypt password hashes, session digests and JSON values. The new optional `Examination.pausedAt` field has no source equivalent and remains null for imported records. Review the printed counts and verify important records before directing the frontend to the new backend.

## 4. If PostgreSQL is unavailable

Do not invent or reset existing data. Keep a secure backup of the original PostgreSQL database or obtain a database dump from the provider. Run the importer later when the old database is accessible. Until then, the SQLite seed command creates only a new administrator, six starter classes and two starter subjects; it does not recreate historical students or results.
