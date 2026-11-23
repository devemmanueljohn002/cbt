# FastAPI Migration Report

## Implemented in this workspace

- Added a FastAPI backend under `backend/` using SQLAlchemy 2.x and SQLite.
- Added SQLAlchemy mappings for all 23 Prisma models and the seven schema enums.
- Added Alembic initial schema migration.
- Added bcrypt-compatible password hashing, digest-only session tokens, seven-day HTTP-only `sid` cookies, role dependencies, login rate limiting and audit records.
- Added admin endpoints for classes, students, CSV import/export, password resets, teachers, subjects, topics, questions, examinations, rounds, participants, results, class score recalculation, audit logs, announcements, settings and certificates.
- Added student dashboard and examination-session APIs, answer saving, deadline enforcement, server-side scoring, result publication, pause/resume deadline handling and public individual/class leaderboards.
- Added a Next.js API catch-all proxy and changed server-rendered admin, teacher, student and leaderboard pages to call FastAPI.
- Restored the detailed student-management UI from the misplaced root-level source file into `src/app/admin/students/page.tsx`.
- Removed obsolete Prisma-backed Next.js route handlers and direct Prisma runtime imports from the active source tree.
- Removed Prisma/PostgreSQL runtime packages from `package.json` and updated `package-lock.json` offline. The original Prisma schema and SQL migration remain as historical migration references.
- Added a PostgreSQL-to-SQLite importer that defaults to dry-run and refuses to merge into non-empty SQLite tables.

## Validation performed in the isolated workspace

- Python syntax compilation: passed.
- SQLAlchemy metadata import: passed; 23 tables registered.
- SQLite schema creation: passed.
- Alembic `upgrade head`: passed; 23 application tables created.
- FastAPI app import and route registration: passed; 53 routes registered.
- Backend integration tests: 3 passed, covering authentication boundaries, admin class/student/question/exam creation, teacher account assignment/dashboard, exam start/pause/resume/save/submit, answer secrecy, result publication, round participation, class aggregation and saved leaderboards. Because this isolated environment had no network access and no `bcrypt` wheel, the tests were run with a temporary test-only bcrypt-compatible stub on `PYTHONPATH`. This validated API/session/business flow but did **not** verify the real bcrypt implementation. The project requirements include real `bcrypt`; rerun tests in the Windows virtual environment without the stub.
- `npm install --package-lock-only --ignore-scripts --offline`: passed and updated the lockfile.
- `npm ci --ignore-scripts --offline`: could not complete because required package tarballs were not cached and external network access was unavailable. A global `tsc --noEmit` attempt also could not complete because Next.js/React/Node type packages were not installed (the errors were missing-module/JSX-type errors). Therefore TypeScript checking and the Next.js production build have not been verified in this workspace.

## Not completed / requires owner action

1. No old PostgreSQL URL or database dump was included. Actual production data import remains pending until the old PostgreSQL source is available.
2. The real bcrypt wheel must be present in the target virtual environment; then run the backend tests again without any test stub.
3. Install frontend packages on the Windows machine (`npm ci`) and run `npm run typecheck` and `npm run build`. Fix any environment-specific Next.js/TypeScript errors before production.
4. The existing schema's `StudentAnswer` only stores option IDs. Typed numeric/expression answer submission and automatic marking require a deliberate schema extension; this archive's current UI uses multiple-choice options.
5. The current inter-class scoring implementation uses the schema's `AVG_PERCENT` default. Other aggregation rules have not been invented.
6. Production deployment needs HTTPS, `COOKIE_SECURE=true`, a strong private environment configuration, backups, and a concurrency review. SQLite may not be the best final database for high-concurrency live competitions.

## Decision on removing Prisma

The active application source no longer imports Prisma, and the frontend package manifest no longer includes Prisma or `pg`. The Prisma schema and migration are intentionally retained as reference artifacts for data migration and traceability. Do not delete those reference files until the PostgreSQL-to-SQLite data import has been completed and verified.
