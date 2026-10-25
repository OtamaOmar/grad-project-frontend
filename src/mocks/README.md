# Mock API

With `VITE_USE_MOCKS=true` (the default in `.env.example`), every call made through
`services/http.js` is answered here, in the browser, with 150–450 ms of fake latency.
Pages don't know the difference: switching to the real backend is `VITE_USE_MOCKS=false`.

## Sign in

Every mock account uses the password `password`.

| Role        | Username      |
| ----------- | ------------- |
| Admin       | `admin`       |
| Coordinator | `coordinator` |
| Student     | `student`     |
| Advisor     | `advisor`     |

## Layout

```text
mocks/
├── server.js        # Matches METHOD + path to a handler (do not edit per feature)
├── errors.js        # mockError(status, code, message, details)
├── session.js       # Mock session (stands in for the httpOnly cookie) + requireRole()
├── utils.js         # listResponse(), findOr404(), requireFields(), nextId(), now()
├── data/            # Fixtures. Shared ones below; feature-specific ones next to them
│   ├── reference.js # bylaws, programs, tracks, terms, standing, grade scales, credit limits, data gaps
│   ├── courses.js   # courses, components, requisites, placements, CLASS_SIZES
│   ├── people.js    # students, app users, advisor assignments
│   ├── records.js   # enrollments (generated), academicSummary()
│   └── forecasts.js # forecast runs, offering_forecast rows, evidence, decisions
└── handlers/        # One file per resource; every file is auto-registered
```

## Conventions

- **Field names are database columns** (`snake_case`), as the Node API returns them. Enum values
  are codes (`active`, `old_cs`, `lecture`), never display text; the UI translates them.
- **Paths are relative to `VITE_API_URL`** (which ends in `/api`): the contract's
  `GET /api/forecast-runs` is `path: "/forecast-runs"` here.
- **Contract endpoints** (docs/api-contract.md) use the contract's exact path and shape.
  Anything else (admin, student academic views, advisor) is a **proposal**: say so in the
  handler file's header comment so the backend team can review it.
- **Lists** return `{ items, total, page, page_size }` via `listResponse()` and accept
  `q`, `sort` (`field` / `-field`), `page`, `page_size`, plus filters.
- **Auth**: call `requireRole("admin")` etc. first, so 401/403 behave like the real API.
- **Errors**: `throw mockError(400, "VALIDATION_ERROR", "…", { fields: { name: "required" } })`.
- **Writes** mutate the in-memory arrays, so a change shows up on the next read until reload.
- Data must be **deterministic** (no `Math.random()` at module load without a seed).
- Pages never import from `mocks/`; they call `services/api/*`.
