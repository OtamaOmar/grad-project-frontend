# Evidence format

How a predicted headcount is traced to the rule that set each probability `p`, and how that trace is shown without student identifiers.

Sources: [database-design.md](/cursor/stores/bc-a41049f8-3811-4a24-a05c-7bb12ec21663/docs/database-design.md) (`forecast_line`, `offering_forecast`, `enrollment`, `source_reference`, `source_passage`, §17a) and [phase1-implementation-roadmap.md](/cursor/stores/bc-a41049f8-3811-4a24-a05c-7bb12ec21663/docs/phase1-implementation-roadmap.md) (course-detail aggregate, explanation context).

Related: [api-contract.md](/cursor/stores/bc-a41049f8-3811-4a24-a05c-7bb12ec21663/docs/api-contract.md), [forecast-io.md](/cursor/stores/bc-a41049f8-3811-4a24-a05c-7bb12ec21663/docs/forecast-io.md).

## Whole system

Evidence is the stored reason a headcount is what it is. A forecast run writes one `offering_forecast` row per course and, for the pairs that matter, one `forecast_line` per student and course. The line records the first ordered rule that matched (report Table 8) and whether the credit-cap walk later set that `p` to 0. The headcount is the sum of the `p` values that remain. Unresolved pairs stay out of the sum and are counted.

`source_reference` and `source_passage` are different kinds of citation.

| | `source_reference` | `source_passage` (RAG citation) |
|---|---|---|
| What it is | A text label on a catalog or forecast row: the article, sheet cell, or method version the row was taken from | A retrieved passage of official text the explanation may quote |
| Where it lives | Reference and catalog tables (bylaw, credit limits, courses, requisites, plan rows, and similar). Also `offering_forecast` and optional `data_gap`. Not on `student`, `enrollment`, `offering_decision`, or `forecast_line` | `source_passage` only |
| On a forecast row | Method label and rule version, for example `phase1-baseline v1`. Not a bylaw article | Not stored on the forecast row. The explanation reads passages at request time |
| Who writes it | Seed, import, or the forecast service | Ingestion into `source_passage`. The explanation reads this table and writes nothing |

The retrieval explanation may quote `source_passage` and may point at stored rule or forecast rows. It cannot change `p`, a headcount, or an opening decision.

**Phase 2 has no evidence contract.** Advising, dynamic offering blocks, and the student plan workspace are a designed continuation only (database-design §20). These docs do not define tables, columns, or payloads for them. Do not store advising messages, block membership, or plan-workspace state in `forecast_line` or `source_passage`. The `advisor` role on `app_user` is reserved and unused until that module is scoped.

## Phase 1 (this phase)

### What the enrollment row means before a line is written

The forecast does not read the file label as the pass rule. Import derives `attempt_state`. The engine uses that derived value.

| Column | Role | Allowed values |
|---|---|---|
| `status` | File label only. Never the pass/fail rule by itself | `registered`, `passed`, `failed`, `withdrawn`, `incomplete` |
| `percentage` | Course result fed to the pass test. Null when the file has no mark. Not a substitute for `status` | `numeric(5,2)`, 0 to 100, or null |
| `final_exam_percentage` | Required for the 2025 pass test when the bylaw sets a final-exam floor. Null when the file does not carry it | `numeric(5,2)`, 0 to 100, or null |
| `attempt_state` | Rule-engine input. Derived at import from `status`, term context, and the §7 pass test. Not rewritten by a database trigger | `passed`, `failed`, `active`, `withdrawn`, `unresolved`, `not_started` |

`not_started` is never loaded from the file. It is the engine’s value for a sheet course with no enrollment row. A repeat is a new `enrollment` row in a later term. There is no unique `(student_id, course_id)`.

Pass test (§7): `percentage >= bylaw.pass_percentage`, and, when `bylaw.final_exam_min_percentage` is set, `final_exam_percentage >= final_exam_min_percentage`. If a value the test needs is null, the test is not run and the file label is kept. A mismatch between a `passed`/`failed` label and the §7 outcome is flagged in the load report. It does not block the insert.

### Stored `forecast_line` (coordinator-only)

One row per student and course in one run, only when the pair reached rules 1–6 or was left unresolved. Pairs that fall through to rule 0 or rule 7 have `p = 0` and are **not stored**. Lines are written once and not edited. Only a coordinator may read this table, because every row names a student.

| Column | Type | Required rule |
|---|---|---|
| `offering_forecast_id` | bigint | The course row of this run. Unique with `student_id` |
| `student_id` | bigint | The student this line explains. Never copied into the API aggregate below |
| `rule_number` | smallint | First matching rule, `1` to `6` |
| `p` | numeric(6,4), nullable | `0` to `1`. Null exactly when unresolved |
| `is_unresolved` | boolean, default false | Unknown repeat intention, unscored standing, or another missing fact |
| `unresolved_reason` | varchar(40), nullable | Set exactly when unresolved. Examples: `repeat_intention_unknown`, `senior_standing_unscored` |
| `trimmed_by_cap` | boolean, default false | True when the credit-cap walk set this `p` to 0. Implies not unresolved |
| `matched_credit_limit_id` | bigint, nullable | The `credit_limit` row matched for this student and term |

Checks, all three:

| Check | Meaning |
|---|---|
| `p` is null exactly when `is_unresolved` | A resolved line has a `p` from 0 to 1. An unresolved line has no `p` |
| `unresolved_reason` is set exactly when `is_unresolved` | No reason on a resolved line, and no unresolved line without a reason |
| `trimmed_by_cap` implies not `is_unresolved` | A trimmed line was a real candidate. Unresolved pairs are not trimmed and are not in the headcount |

Cap walk (§17a): candidates are taken in official sheet order. Each candidate’s full credits are added against the matched maximum. A course that would exceed the maximum gets `trimmed_by_cap = true` and `p = 0`. A null maximum trims nothing. A null `counts_toward_registration_cap` is neither added nor dropped. An unresolved pair is not a trim candidate.

### API aggregate (no student ids)

`GET /api/forecast-runs/:runId/courses/:courseId` returns aggregates by rule. Course detail shows rule 1–6 counts, unresolved reasons, and the trimmed-by-cap count. `POST /api/explanations` sends the same kind of aggregate to FastAPI: counts by rule, no student identifiers. Do not put `student_id`, the university ID, or a list of lines in this object.

The numbers below are a shape example. They are not the Table 10 fixture (that check is in [forecast-io.md](/cursor/stores/bc-a41049f8-3811-4a24-a05c-7bb12ec21663/docs/forecast-io.md)).

```json
{
  "forecast_run_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "course_id": 18,
  "method": "rates",
  "source_reference": "phase1-baseline v1",
  "predicted_headcount": "12.40",
  "is_incomplete": true,
  "unresolved_pair_count": 1,
  "null_cap_student_count": 0,
  "first_year_undefined_student_count": 2,
  "cap_flag_unknown_student_count": 0,
  "by_rule": [
    { "rule_number": 2, "line_count": 10, "trimmed_by_cap_count": 1 },
    { "rule_number": 4, "line_count": 6, "trimmed_by_cap_count": 0 }
  ],
  "unresolved_reasons": [
    { "unresolved_reason": "senior_standing_unscored", "line_count": 1 }
  ]
}
```

`predicted_headcount` is the unrounded sum of remaining `p` values, stored as `numeric(10,2)`. It does not include unresolved pairs. `is_incomplete` is true when any of the four counts is greater than 0. `method` is `rates` or `simple_count`. `source_reference` here is the method label, not a passage citation.

### `source_passage` fields the explanation may cite

| Column | Use in a citation |
|---|---|
| `source_document` | Which PDF, for example `old_cs_bylaw_pdf` or `bylaw_2025_pdf` |
| `article` | For example `Art. 10`. Null when the passage is not an article |
| `page` | Page in that PDF |
| `language` | `ar` or `en` |
| `passage_text` | The extracted text |
| `bylaw_id` | Set for bylaw text. Null for other approved academic information |
| `verified_against_pdf` | Stays false until a person has checked the extraction |
| `embedding` | pgvector. Dimension is fixed when the embedding model is chosen in week 1 |

A citation chip is an article and page, or a stored-row label. Every citation id in an answer must exist in the context Node supplied, and every number in the answer must appear in that context. `source_reference` on a seeded row is not a RAG citation.
