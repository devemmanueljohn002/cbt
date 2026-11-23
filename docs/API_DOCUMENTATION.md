# Championship Platform API

Base prefix: `/api/v1`

Interactive documentation is available at `/docs` while FastAPI is running.

## Authentication

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/auth/login` | Login with `loginId` and `password`; sets the HTTP-only `sid` cookie |
| POST | `/auth/logout` | Invalidates the current session and clears the cookie |
| GET | `/auth/me` | Returns the authenticated user and linked profile |
| POST | `/auth/change-password` | Changes the current user's password |

## Administration (ADMIN role)

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/admin/overview` | Dashboard counters |
| GET/POST | `/admin/classes` | List/create classes |
| PATCH/DELETE | `/admin/classes/{class_id}` | Update/delete an empty class |
| GET/POST | `/admin/students` | Paginated student list/create |
| PATCH | `/admin/students/{student_id}` | Update student profile, class or active status |
| POST | `/admin/students/{student_id}/reset-password` | Reset credentials and invalidate sessions |
| POST | `/admin/students/import` | CSV import, maximum 300 rows |
| GET | `/admin/students/export` | Spreadsheet-safe CSV export |
| GET/POST | `/admin/teachers` | List/create teacher accounts |
| GET/POST | `/admin/subjects` | List/create subjects |
| GET/POST | `/admin/topics` | List/create topics |
| GET/POST | `/admin/questions` | List/create questions; admin responses include correct-answer flags |
| PATCH | `/admin/questions/{question_id}` | Update question fields/status |
| GET/POST | `/admin/examinations` | List/create examinations |
| PATCH | `/admin/examinations/{exam_id}` | Go live, pause, resume, close, cancel or publish results |
| GET/POST | `/admin/rounds` | List/create competition rounds |
| GET/POST | `/admin/rounds/{round_id}/participants` | List/add round participants |
| PATCH | `/admin/rounds/{round_id}/participants/{student_id}` | Update qualification status |
| POST | `/admin/rounds/{round_id}/leaderboard/generate` | Save individual and class leaderboard snapshots |
| GET | `/admin/leaderboards` | List saved leaderboard snapshots |
| POST | `/admin/class-scores/recalculate` | Persist class aggregates from published results |
| GET | `/admin/results` | Admin result listing |
| GET | `/admin/audit-logs` | Recent audit events |
| GET/POST | `/admin/announcements` | List/create announcements |
| GET/PUT | `/admin/school-settings` | Read/update school settings |
| GET/POST | `/admin/certificates` | List/issue certificates |

## Teacher

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/teacher/dashboard` | Assigned classes and student counts |

## Student

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/student/dashboard` | Student profile, eligible exams and published results |
| GET | `/student/exams/{exam_id}` | Instructions, active exam questions or submitted result |
| POST | `/student/exams/{exam_id}` | `start`, `save`, `submit` or `visibility` action |

## Public

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/leaderboard` | Published individual and class rankings; optional `roundId` filter |
| GET | `/healthz` | Service health check |

## Examination security contract

Student exam question payloads contain only question text, type, image/topic metadata and option IDs/labels/text. They never contain `isCorrect` or explanations. Answer evaluation and score calculation happen on the backend. A session belongs to exactly one student and exam; the database unique constraint prevents duplicate sessions/results.

Pausing an examination records the pause timestamp. Resuming extends the examination end time and active student-session deadlines by the pause duration; active session start timestamps are shifted by the same amount so paused time is excluded from the recorded examination duration. A paused session does not expose questions or accept answer changes until resumed.

The existing scoring rule is preserved: sum marks for correct options; if negative marking is enabled, subtract one point per incorrect response and clamp the score at zero. Total marks are the sum of marks for all linked questions.

## Inter-class scoring rule

The original schema sets `CompetitionRound.classAggregation` to `AVG_PERCENT`, but the supplied source did not implement a calculation. The initial backend implements `AVG_PERCENT`: average each student’s published result percentages within the selected round, then average those student averages equally across the class. When round participants have been explicitly registered, only those students are included. The participant count is the number of distinct included students with published results. `points` mirrors the computed average percentage for ranking. Other aggregation values require a separately specified rule before use.
