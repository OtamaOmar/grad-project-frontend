# API contract

Phase 1 HTTP surface for the five-person team: who may call what, how identity is taken, and how errors and explanations behave.

Source: [phase1-implementation-roadmap.md](/cursor/stores/bc-a41049f8-3811-4a24-a05c-7bb12ec21663/docs/phase1-implementation-roadmap.md) §4.1–§4.5, §7, §9, §12. Field meanings: [database-design.md](/cursor/stores/bc-a41049f8-3811-4a24-a05c-7bb12ec21663/docs/database-design.md).

Related: [evidence-format.md](/cursor/stores/bc-a41049f8-3811-4a24-a05c-7bb12ec21663/docs/evidence-format.md), [forecast-io.md](/cursor/stores/bc-a41049f8-3811-4a24-a05c-7bb12ec21663/docs/forecast-io.md).

## Whole system

The browser talks only to the Node API. Node talks to FastAPI for explanations. FastAPI has no headcount, eligibility, or approval authority. A role or user id sent by the browser is never the identity of the request. The server reads `app_user` for the session.

Roles on `app_user.role` are `student`, `coordinator`, and `advisor`. `advisor` is reserved for Phase 2 and is not a Phase 1 caller.

**Phase 2 has no API contract.** Advising, dynamic offering blocks, and the student plan workspace have no routes, no request bodies, and no response samples. Do not add endpoints for `student_plan`, `offering_block`, `block_membership`, `block_forecast_link`, `advising_case`, or `advising_message`. StudentHome may say that advising arrives in Phase 2. That sentence is not an endpoint.

## Phase 1 (this phase)

### Ownership

Omar owns `grad-project-backend/contracts/`:

| File | Approver for every change |
|---|---|
| `rest-api.md` and REST samples | Backend B |
| `ai-explain.md` request and retrieval fields | AI A |
| `ai-explain.md` answer, citation, and refusal fields | AI B |
| `errors.md` | Backend B (REST envelope). AI errors are mapped into this envelope |
| `decisions.md` | The owners of the interpretation being locked |
| `samples/*.json` | The approver of the section the sample belongs to |

A contract change needs that approver’s review plus Omar’s. Backend A owns `db/queries/README.md` directly. It is not under `contracts/`. Pages call `src/api/` only.

### Session identity

- The Node-issued JWT travels in an httpOnly `SameSite=Strict` cookie.
- `authenticate` runs on every Node route except health, `POST /api/auth/signup/lookup`, `POST /api/auth/signup`, and `POST /api/auth/login`.
- `requireRole` reads `app_user.role` from the database, not from the token payload alone.
- The user id is `req.user.id` from that session. Zod rejects a client-sent `userId` or `approvedBy`.
- Do not log passwords, tokens, `Cookie`, or `Authorization`.

### Error envelope

Node has one error envelope, specified in `contracts/errors.md`. FastAPI failures are mapped into that same envelope. Explanations are not stored. This phase does not add error-body fields the roadmap has not named. The statuses below are the ones tests must cover.

| Situation | HTTP status |
|---|---|
| Missing or expired session | 401 |
| Signed in, wrong role | 403 |
| Validation failure, or Node JSON body over 16 KB | 400 |
| `POST /explain` with no `X-Service-Key` | 401 |
| `POST /explain` question over 500 characters, or FastAPI body over 64 KB | 422 or 400 |

Rate limits are in-memory: per IP on auth, per uid on forecast-run and explanations.

### Phase 1 route table

Coordinator routes use `requireRole('coordinator')`. A student receives 403 on forecast routes. There is no admin UI. Coordinator accounts come from `src/cli/create-coordinator.js`.

| Method and path | Who | Behaviour |
|---|---|---|
| `POST /api/auth/signup/lookup` | Public | University ID must already exist in `student` |
| `POST /api/auth/signup` | Public | ID must exist in `student` and must not already be linked. Username and Argon2id password go on `app_user` |
| `POST /api/auth/login` | Public | One login for students and coordinators. Sets the session cookie |
| `POST /api/auth/logout` | Session | Ends the session |
| `GET /api/me` | Session | Identity for the auth guard. Role comes from the database |
| `PATCH /api/me/onboarding` | Session | Saves name, birthdate, language (`en` or `ar`), and theme (`light` or `dark`) |
| `POST /api/forecast-runs` | Coordinator | Starts one baseline run. Body in [forecast-io.md](/cursor/stores/bc-a41049f8-3811-4a24-a05c-7bb12ec21663/docs/forecast-io.md) |
| `GET /api/forecast-runs?termId=` | Coordinator | Runs for one target term |
| `GET /api/forecast-runs/:runId/courses` | Coordinator | Dashboard rows for one run |
| `GET /api/forecast-runs/:runId/courses/:courseId` | Coordinator | One course: aggregates by rule, no student ids. See [evidence-format.md](/cursor/stores/bc-a41049f8-3811-4a24-a05c-7bb12ec21663/docs/evidence-format.md) |
| `GET /api/courses/:courseId/rules` | Coordinator | Stored requisite groups for that course |
| `PUT /api/offering-decisions` | Coordinator | Opening flags. Approver is the session, with a name snapshot. Not forecast output |
| `GET /api/offering-decisions?termId=` | Coordinator | Decisions for a term |
| `GET /api/data-gaps` | Coordinator | Open holes. Status is `open` or `resolved` |
| `POST /api/explanations` | Coordinator | Builds context from stored rows and calls FastAPI. Does not persist the answer |
| `GET /health` | Public on FastAPI | No service key. FastAPI binds `127.0.0.1` |
| `POST /explain` | Node only | FastAPI. Requires `X-Service-Key` |

### `POST /explain`

The browser never calls this route. Node calls it with axios, the `X-Service-Key` header from the environment, and an 8 second timeout. Pydantic schemas come from `contracts/ai-explain.md`. The dispatcher accepts only `kind` `rule` and `kind` `forecast`.

Node’s context is stored rows only: requisites, `credit_limit`, the `offering_forecast` row, and `forecast_line` counts by rule. No student identifiers. See the aggregate in [evidence-format.md](/cursor/stores/bc-a41049f8-3811-4a24-a05c-7bb12ec21663/docs/evidence-format.md).

```json
{
  "kind": "forecast",
  "question": "Why is this predicted headcount incomplete?"
}
```

`kind` is `rule` or `forecast`. `question` is at most 500 characters. The FastAPI body limit is 64 KB. Node attaches the context object before the call. The sample files for that object are `contracts/samples/explain-context-*.json`.

| Kind | What the answer may use |
|---|---|
| `rule` | Node-supplied rule rows plus passages from `retrieve(question, bylaw_code, k)` |
| `forecast` | The stored `offering_forecast` row and the aggregated `forecast_line` counts Node sent. Cites only those supplied rows |

Refusals, all of them:

| Case | Result |
|---|---|
| Missing `X-Service-Key` | 401. The stub must reject this |
| Question or body over the size limit | 422 or 400 |
| General chat, or advice to a student | Refused. Allowlist is rule meaning, why a number is what it is, and which article |
| A request to decide, including “should I open a lab?” | Refused. The panel must not show an AI answer as a decision |
| A citation id is missing from the context, or a number in the answer is not in the context | Replaced with a “could not ground” refusal |

Python does not compute `p`, headcount, eligibility, sections, or approval.

### Size limits

| Boundary | Limit |
|---|---|
| Node `express.json` | 16 KB |
| FastAPI request body | 64 KB |
| `question` | 500 characters |
| Explain timeout | 8 seconds |
| Auth rate limit | In-memory, per IP |
| Forecast-run and explanations rate limit | In-memory, per uid |

### What is not in the contract

- Any Phase 2 advising, plan-workspace, or dynamic-block route or payload.
- A generic student chatbot. Students have no chat in Phase 1.
- Hidden-semester MAE, an accuracy field, or an evaluation run. UC4 stays blocked on Nile registration history.
- Client `userId` or `approvedBy` on any body.
- Section counts on `PUT /api/offering-decisions`.
- Stored explanation rows.
- SSO, password-reset email, refresh tokens, an admin console.
- API versioning, GraphQL, WebSockets, a message queue, Redis.
- Registration write-back, timetable, room scheduling, petitions, internship workflow.
- A second error envelope for FastAPI. AI failures use `contracts/errors.md`.
