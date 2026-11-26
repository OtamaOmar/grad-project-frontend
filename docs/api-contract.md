> Copy of `grad-project-backend/docs/api-contract.md`. The backend copy is the source; links below point into the backend repo.

# API contract

Phase 1 HTTP surface: who may call what, how identity is taken, and how errors and explanations behave.

Updated 2026-11-27. Owner: Omar. Every change needs Omar's review; REST and error-envelope changes also need Backend B (Ayman).
Related: [errors.md](../contracts/errors.md), [forecast-io.md](forecast-io.md), [evidence-format.md](evidence-format.md), [database-design.md](database-design.md).

Each route below is marked **Built** (code and tests exist on the branch named) or **Planned** (agreed, not built yet, with its owner).

## Whole system

The browser talks only to the Node API. Node talks to FastAPI for explanations. FastAPI has no headcount, eligibility, or approval authority, and writes no tables. A role or user id sent by the browser is never the identity of the request; the server reads `app_user` for the session.

Roles on `app_user.role`:

| Role | Phase 1 use | How the account is made |
|---|---|---|
| `student` | Own academic record | Self-signup with a university ID that exists in `student` |
| `coordinator` | Opening decisions, forecast review | `npm run user:create -- --role coordinator ...` |
| `advisor` | Reserved for Phase 2. No Phase 1 routes | `npm run user:create -- --role advisor ...` |
| `admin` | The five team members. Admin pages | `npm run user:create -- --role admin ...`, each person for themselves |

**Phase 2 has no API contract.** Advising, dynamic offering blocks and the student plan workspace have no routes, no request bodies and no response samples. Do not add endpoints for `student_plan`, `offering_block`, `block_membership`, `block_forecast_link`, `advising_case` or `advising_message`.

## Session identity

- Login sets a Node-signed JWT (HS256, user id only) in the httpOnly, `SameSite=Strict` cookie `acops_session`. It lasts 8 hours. There are no refresh tokens; the user signs in again. The cookie is `Secure` in production.
- `authenticate` runs on every route except `GET /health`, `POST /api/auth/signup/lookup`, `POST /api/auth/signup` and `POST /api/auth/login`. It loads the active `app_user` row on every request, so a role change or deactivation applies at once.
- `requireRole` checks the role from that row, never from the token or the client.
- Bodies and queries are parsed with strict Zod schemas: any key the route does not expect is a `400`. This is how a client-sent `userId` or `approvedBy` is refused.
- The browser origin allowed to send the cookie is `CORS_ORIGIN` (default `http://localhost:5173`).

## Errors

One envelope, defined in [contracts/errors.md](../contracts/errors.md):

```json
{ "error": { "code": "SOME_CODE", "message": "Human text", "details": [] } }
```

| Situation | HTTP status |
|---|---|
| Missing, forged or expired session; deactivated account | 401 |
| Signed in, wrong role | 403 |
| Validation failure, unexpected key, bad JSON, or JSON body over 16 KB | 400 |
| Unknown university ID at signup / unknown route | 404 |
| University ID already has an account, or username taken | 409 |
| Too many auth requests | 429 |
| `POST /explain` with no `X-Service-Key` | 401 |
| `POST /explain` question over 500 characters, or FastAPI body over 64 KB | 422 or 400 |

## Conventions

| Topic | Rule |
|---|---|
| Ids | JSON numbers |
| Decimals from `numeric` columns (headcount, grade points) | Strings, for example `"2.05"`, so no precision is lost |
| Dates | `YYYY-MM-DD`; timestamps are ISO 8601 |
| Null | Means unknown or not stated. The UI shows "-", never 0 |
| List endpoints | Query: `q` (search text), exact-match filters (`all` or empty = no filter), `sort` (a listed column, `-` prefix = descending), `page` (from 1), `page_size` (default 10, max 100). Response: `{ items, total, page, page_size }`, where `total` counts every match. An unknown `sort` or a `page_size` over 100 is a `400` |

## Size limits

| Boundary | Limit |
|---|---|
| Node `express.json` | 16 KB |
| FastAPI request body | 64 KB |
| `question` | 500 characters |
| Explain timeout | 8 seconds |
| Auth rate limit | 20 requests per IP per 15 minutes, in memory |
| Forecast-run and explanations rate limit | In memory, per user. Planned with those routes |

## Route table

| Method and path | Who | Status | Behaviour |
|---|---|---|---|
| `GET /health` | Public | Built (`feature/backend-application-layer`) | `{ "status": "ok" }` |
| `POST /api/auth/login` | Public | Built (`feature/backend-application-layer`) | Body `{ username, password }`. Username ignores case and spaces. Sets the session cookie, returns `{ user }`. `401 INVALID_CREDENTIALS`, `403 ACCOUNT_INACTIVE` |
| `POST /api/auth/logout` | Session | Built (`feature/backend-application-layer`) | Clears the cookie. `204` |
| `GET /api/me` | Session | Built (`feature/backend-application-layer`) | `{ user }`. Role comes from the database |
| `POST /api/auth/signup/lookup` | Public | Built (`feature/backend-student-workflow`) | Body `{ university_id }`. Returns `{ university_id, cohort_year }`. `404 STUDENT_NOT_FOUND`, `409 ALREADY_LINKED` |
| `POST /api/auth/signup` | Public | Built (`feature/backend-student-workflow`) | Body `{ university_id, username, password }`. Username 3-64 of `a-z 0-9 . _ -`; password 8-128. Creates the student account, signs in, `201 { user }`. `404`, `409 ALREADY_LINKED`, `409 USERNAME_TAKEN` |
| `PATCH /api/me/onboarding` | Session | Built (`feature/backend-student-workflow`) | Body: any of `full_name`, `birthdate` (`YYYY-MM-DD`), `preferred_language` (`en`/`ar`), `preferred_theme` (`light`/`dark`). Saves only what is sent; the first save sets `onboarded_at`. Returns `{ user }` |
| `GET /api/student/academic-data` | Student | Built (`feature/backend-student-workflow`) | The signed-in student's record. See below |
| `PUT /api/offering-decisions` | Coordinator | Built (`feature/backend-coordinator-workflow`) | Opening flags for one course and term. See below |
| `GET /api/offering-decisions?termId=` | Coordinator | Built (`feature/backend-coordinator-workflow`) | One page of the term's decisions. List query plus `bylaw_code`, `course_id`. Sorts: `course_code` (default), `course_title`, `bylaw_code`, `predicted_headcount`, `approved_by_name`, `approved_at`, `updated_at`, `created_at` |
| `GET /api/admin/users/summary` | Admin | Built (`feature/backend-admin`) | `{ total_active, total, students, students_on_2025, advisors, coordinators, admins }` (active accounts, except `total`) |
| `GET /api/admin/users` | Admin | Built (`feature/backend-admin`) | One page of accounts. List query plus `role`, `status` (`active`/`inactive`). Sorts: `display_id` (default), `full_name`, `username`, `role`, `status`, `created_at`. Row below |
| `GET /api/admin/credit-limits/summary` | Admin | Built (`feature/backend-admin-reference`) | `{ total, stated_count, unstated_count, bylaw_count, highest_max_credits, open_gaps, by_bylaw }`. `open_gaps` are the open `data_gap` rows whose `affected_entity` starts with `credit_limit` |
| `GET /api/admin/credit-limits` | Admin | Built (`feature/backend-admin-reference`) | `credit_limit` rows plus `bylaw_code`, `rule_kind` (`maximum`/`minimum`/`floor_waived`/`unstated`), `category` (display group), `is_unstated`, `data_gap_id` (always null: no link column). List query plus `bylaw_id`, `bylaw_code`, `term_type`, `population`, `category`, `rule_kind`; 100 per page by default; default order is bylaw, then priority |
| `GET /api/admin/data-gaps/summary` | Admin | Built (`feature/backend-admin-reference`) | `{ total, open, resolved, open_by_severity, by_category, affected_bylaws, linked_import_issues, last_updated_at }`. `open_by_severity` and `linked_import_issues` are null |
| `GET /api/admin/data-gaps` | Admin | Built (`feature/backend-admin-reference`) | `data_gap` rows plus `gap_code` (`GAP-001`), `severity` (null), `bylaw_scope`, `import_issue_count` (null). List query plus `status`, `category`, `severity`, `affected_entity`; default sort `id` |
| `GET /api/admin/data-gaps/:id` | Admin | Built (`feature/backend-admin-reference`) | One gap plus `import_issues: []`. `404 NOT_FOUND` for an unknown id |
| `POST /api/forecast-runs` | Coordinator | Planned, Ayman | Starts one baseline run. Body in [forecast-io.md](forecast-io.md) |
| `GET /api/forecast-runs?termId=` | Coordinator | Planned, Ayman | Runs for one target term |
| `GET /api/forecast-runs/:runId/courses` | Coordinator | Planned, Ayman | Dashboard rows for one run |
| `GET /api/forecast-runs/:runId/courses/:courseId` | Coordinator | Planned, Ayman | One course: aggregates by rule, no student ids. See [evidence-format.md](evidence-format.md) |
| `GET /api/courses/:courseId/rules` | Coordinator | Planned, Ayman | Stored requisite groups for that course |
| `GET /api/data-gaps` | Coordinator | Planned, owner not set | Open holes. Status is `open` or `resolved` |
| `POST /api/explanations` | Coordinator | Planned, Omar (blocked on the FastAPI service) | Builds context from stored rows and calls FastAPI. Does not store the answer |
| `GET /health` (FastAPI) | Public on FastAPI | Planned, AI team | No service key. FastAPI binds `127.0.0.1` |
| `POST /explain` (FastAPI) | Node only | Planned, AI team | Requires `X-Service-Key` |

### `user` object

Returned by login, signup, `/api/me` and onboarding. Never contains password data.

```json
{
  "id": 7, "role": "student", "username": "mora22t", "full_name": "Omar Tarek",
  "student_id": 412, "birthdate": "2005-03-14",
  "preferred_language": "en", "preferred_theme": "light", "onboarded_at": "2026-11-27T10:00:00.000Z"
}
```

`student_id` is null for staff. There is no `phone`, `email`, `staff_code` or `last_login_at`: `app_user` has no such columns, and sending `phone` to onboarding is a `400`.

### `GET /api/student/academic-data`

```json
{
  "profile": { "university_id", "cohort_year", "bylaw_code", "program_code", "program_name", "track_code", "track_name", "english_path", "math_path" },
  "summary": { "credits_passed", "cgpa", "standing", "standing_band", "attempts", "unresolved_count", "graduation_credits", "credits_remaining", "progress_percent" },
  "terms": [{ "term": { "id", "academic_year", "term_type" }, "courses": [], "credits_attempted", "credits_passed", "term_gpa" }],
  "in_progress": []
}
```

- The student is always the session's `app_user.student_id`. `403 FORBIDDEN` if the account has no student link.
- Passed or not comes from the stored `enrollment.attempt_state`; nothing is recalculated.
- `credits_passed` counts each course once, even if it was passed twice.
- `cgpa`: the highest grade per course counts (confirmed by the doctor on 2026-11-27). Only courses with `counts_in_gpa = true` and letters that have grade points take part. String such as `"2.91"`, or null.
- `term_gpa`: every graded attempt in that term.
- `standing`: the highest `standing_band` whose minimum the passed credits reach. Null when the bylaw has no numbered bands (the old bylaw today).
- Terms are oldest first (spring, summer, fall within a year). `in_progress` lists attempts whose `attempt_state` is `unresolved`.
- Not included yet: `credit_limit`, `planning_term` (need the forecast engine) and `credits_by_area` (no area column).

### `PUT /api/offering-decisions`

Body:

```json
{
  "course_id": 31, "academic_term_id": 9, "offering_forecast_id": 120,
  "lecture_open": true, "tutorial_open": false, "lab_open": null,
  "decision_notes": "Optional reason"
}
```

- Send `offering_forecast_id`, or both `course_id` and `academic_term_id`. With only the forecast row id, the row supplies the course and term. If both are sent they must match the row.
- Flags are `true` (open), `false` (do not open) or `null` (not decided). A non-null flag for a component the course does not have is a `400`. A course with no component rows may set all three.
- Notes are required when a flag goes against the implied sections of the compared forecast row: opened while it implies 0, or closed while it implies 1 or more. A null flag or a null implied count is not compared.
- The compared row is the one sent, or else the newest stored `offering_forecast` row for the course and term. With none, nothing is compared.
- One decision per course and term: saving again replaces it.
- The approver (`approved_by_user_id`, `approved_by_name`, `approved_at`) comes from the session when any flag is set, and is cleared when all three flags are null.
- No section counts are accepted or stored.

Response (same shape as a list item):

```json
{
  "id": 3, "academic_term_id": 9, "course_id": 31, "offering_forecast_id": 120,
  "lecture_open": true, "tutorial_open": false, "lab_open": null, "decision_notes": null,
  "approved_by_user_id": 2, "approved_by_name": "Dr. Coordinator", "approved_at": "...",
  "created_at": "...", "updated_at": "...",
  "course_code": "CSC 211", "course_title": "...", "bylaw_code": "bylaw_2025",
  "components": ["lab", "lecture"], "predicted_headcount": "2.05",
  "implied_lecture_sections": 1, "implied_tutorial_sections": 0, "implied_lab_sections": null,
  "differs_from_implied": false
}
```

### Admin user row

```json
{
  "id": 1, "full_name": "Omar Tarek", "username": "mora22t", "role": "admin",
  "display_id": null, "bylaw_scope": "systemwide", "status": "active",
  "last_login_at": null, "created_at": "..."
}
```

`full_name` falls back to the username. `display_id` is the student's university ID (null for staff). `bylaw_scope` is the student's bylaw code, `systemwide` for admins, `both` for other staff.

### Admin reference reads: what is real and what is null

Every value comes from the database. A field the database has no source for is null or empty, never filled in:

| Field | Value | Why |
|---|---|---|
| Credit limit `data_gap_id` | null | No column links a `credit_limit` row to a gap. The summary's `open_gaps` lists them instead |
| Data gap `severity`, summary `open_by_severity` | null | `data_gap` has no severity. Filtering by severity returns no rows |
| Data gap `import_issue_count`, `import_issues`, summary `linked_import_issues` | null / `[]` | There are no import tables |
| Data gap `bylaw_scope` | Read from the gap itself | `old_cs` when the category starts with `old_` or the source cites the old bylaw PDF or the old study-plan sheets; `bylaw_2025` when the category starts with `new_` or the source cites the 2025 bylaw PDF. Empty when it cites neither |

## `POST /explain`

The browser never calls this route. Node calls it with the `X-Service-Key` header from the environment and an 8 second timeout. Pydantic schemas will come from `contracts/ai-explain.md` (not written yet; owners AI A and AI B). The dispatcher accepts only `kind` `rule` and `kind` `forecast`.

Node's context is stored rows only: requisites, `credit_limit`, the `offering_forecast` row and `forecast_line` counts by rule. No student identifiers. See [evidence-format.md](evidence-format.md).

```json
{ "kind": "forecast", "question": "Why is this predicted headcount incomplete?" }
```

| Kind | What the answer may use |
|---|---|
| `rule` | Node-supplied rule rows plus passages from `retrieve(question, bylaw_code, k)` |
| `forecast` | The stored `offering_forecast` row and the aggregated `forecast_line` counts Node sent. Cites only those rows |

Refusals:

| Case | Result |
|---|---|
| Missing `X-Service-Key` | 401 |
| Question or body over the size limit | 422 or 400 |
| General chat, or advice to a student | Refused. Allowlist: rule meaning, why a number is what it is, which article |
| A request to decide, including "should I open a lab?" | Refused. The panel must not show an AI answer as a decision |
| A citation id missing from the context, or a number not in the context | Replaced with a "could not ground" refusal |

Python does not compute `p`, headcount, eligibility, sections or approval.

## Not in the contract

- Any Phase 2 advising, plan-workspace or dynamic-block route or payload.
- A generic student chatbot. Students have no chat in Phase 1.
- Hidden-semester MAE, an accuracy field, or an evaluation run.
- Client `userId` or `approvedBy` on any body; section counts on `PUT /api/offering-decisions`.
- Stored explanation rows.
- Student dashboard, expected offerings and my-courses routes: the frontend mocks propose them, but they need the forecast engine. They are added here when that work starts.
- Decision history: needs a table that keeps every save.
- Admin routes other than the reads listed above, including every admin write. Most other admin pages need columns or tables that do not exist yet.
- SSO, password-reset email, refresh tokens.
- API versioning, GraphQL, WebSockets, a message queue, Redis.
- Registration write-back, timetable, room scheduling, petitions, internship workflow.
- A second error envelope for FastAPI.
