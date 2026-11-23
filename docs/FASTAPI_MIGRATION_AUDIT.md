# FastAPI Migration Audit

## Source reviewed

Reviewed the supplied `champ-main.zip` archive and its Next.js/Prisma source tree. The archive contained the frontend, Prisma schema/migration/seed, and application source. It did not contain `backend/`, `node_modules/`, `.env`, or a database dump. No live database connection information was supplied, so the old PostgreSQL database could not be inspected.

## Existing architecture

- Next.js 14 App Router, React 18, TypeScript and Tailwind CSS.
- Prisma Client 5 with PostgreSQL as the configured datasource.
- `src/lib/auth.ts` handled the `sid` cookie, seven-day sessions, SHA-256 token digests, bcrypt cost 12, role checks and page redirects.
- Browser-facing API paths were under `/api/admin`, `/api/auth` and `/api/student`.
- Some server components queried Prisma directly, so an API-only replacement would not have been sufficient.

## Database specification

The supplied Prisma schema defines **23 models**:

`User`, `Administrator`, `Teacher`, `SchoolClass`, `Student`, `Subject`, `Topic`, `Question`, `QuestionOption`, `CompetitionRound`, `Examination`, `ExaminationQuestion`, `ExaminationSession`, `StudentAnswer`, `ExaminationResult`, `CompetitionParticipant`, `Leaderboard`, `ClassScore`, `Certificate`, `AuditLog`, `SchoolSetting`, `Announcement`, and `Session`.

It defines seven enums: `Role`, `Difficulty`, `QType`, `ExamStatus`, `SessionStatus`, `QStatus`, and `RoundType`.

Important constraints include unique login IDs, student codes, one session per student/exam, one result per student/exam, unique question links per exam, and one answer per question/session. The `QuestionOption.isCorrect` field is sensitive and must not be exposed to students during an active exam.

## Findings and migration risks

1. Server-rendered admin, teacher, student and leaderboard pages imported Prisma directly.
2. The supplied archive included several student-management handlers as misplaced files at the `src/` root rather than in active App Router route directories. The detailed student-management UI was also at `src/page.tsx` instead of `src/app/admin/students/page.tsx`.
3. `src/route.ts` was an orphaned student password-reset handler, not an active App Router endpoint.
4. The project README described the application as a Phase 1 scaffold and explicitly listed parts of the CBT engine as future work. The supplied code therefore did not prove that all planned workflows had already been implemented.
5. No PostgreSQL connection string or database dump was included. Existing user/student/question/result data cannot be copied until the old database is reachable.
6. The existing `StudentAnswer` schema stores an optional `optionId`, but no free-text answer value. Numeric/expression questions requiring typed responses need an explicit schema extension before automatic free-text marking can be supported.
7. The original class aggregation field defaults to `AVG_PERCENT`, but the archive did not contain an implemented class-scoring service. The new implementation documents the initial average-percentage calculation (each student is weighted equally within the round).

## Migration architecture

- Keep the existing Next.js 14 frontend and its browser-facing `/api/...` URLs.
- Add a Next.js catch-all API proxy that forwards requests and the `sid` cookie to FastAPI.
- Change server-rendered pages to request authenticated data from FastAPI.
- Implement FastAPI with SQLAlchemy 2.x, SQLite, Alembic and Pydantic.
- Preserve the original model/table names, string identifiers, enums, unique constraints and foreign-key relationships where represented by the Prisma schema.
- Preserve bcrypt password hashes and the SHA-256 digest-only session storage design.
- Keep the Prisma schema and migration as historical migration references; Prisma runtime dependencies have been removed from the frontend package manifest.

## Implementation checklist

- [x] Repository and route audit
- [x] SQLAlchemy models for all 23 Prisma models
- [x] SQLite connection and foreign-key enforcement
- [x] Alembic initial migration
- [x] Cookie-based session authentication and role dependencies
- [x] Admin classes, students, subjects, topics, questions and examination endpoints
- [x] Student examination session, answer saving, server-side scoring and result publication
- [x] Individual and class leaderboard response
- [x] Competition round and participant endpoints
- [x] Teacher dashboard and teacher account creation endpoint
- [x] Student CSV import/export and password reset endpoints
- [x] Next.js API proxy and server-side FastAPI integration
- [x] Student management UI restored to the correct App Router page
- [x] PostgreSQL-to-SQLite importer (dry-run by default)
- [x] Backend tests and migration documentation
- [ ] Import actual production PostgreSQL records (requires a working legacy database connection)
- [ ] Run npm install/typecheck/build on the target Windows machine (dependency download was unavailable in this isolated build environment)
- [ ] Verify bcrypt authentication against the target machine's installed bcrypt wheel
