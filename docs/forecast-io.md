# Forecast I/O

What one baseline forecast run reads, what it writes, and what the coordinator dashboard shows. The opening decision is a later request, not a field of the run.

Sources: [database-design.md](/cursor/stores/bc-a41049f8-3811-4a24-a05c-7bb12ec21663/docs/database-design.md) §3 (`offering_forecast`, `offering_decision`, `forecast_line`), §17a, and [phase1-implementation-roadmap.md](/cursor/stores/bc-a41049f8-3811-4a24-a05c-7bb12ec21663/docs/phase1-implementation-roadmap.md) §4.2–§4.3 and §4.5.

Related: [api-contract.md](/cursor/stores/bc-a41049f8-3811-4a24-a05c-7bb12ec21663/docs/api-contract.md), [evidence-format.md](/cursor/stores/bc-a41049f8-3811-4a24-a05c-7bb12ec21663/docs/evidence-format.md).

## Whole system

A forecast run is a deterministic snapshot for one target term. Demand comes from the official study-plan sheets (`plan_template` / `plan_slot`), not from every course whose prerequisites a student happens to meet. The same inputs and the same ordered rules produce the same `offering_forecast` and `forecast_line` rows, aside from ids and timestamps. The run does not approve anything. A person records opening flags on `offering_decision` afterward.

Headcount is an unrounded sum of remaining `p` values. Implied section counts are `ceil` of that headcount divided by the team class size stored on the row. They are not official capacity. The formula does not read `course_component.max_students` (that column stays null).

`is_evaluation_replay` exists so a later hidden-semester replay (UC4) can mark a run. Phase 1 leaves it false. No phase in this design publishes an MAE. Accuracy waits on Nile registration history that has not arrived.

**Phase 2 has no forecast I/O contract.** Dynamic offering blocks, advising, and the plan workspace are not inputs and not outputs of this run. Do not add a block id, a plan-workspace body, or a second demand method to `POST /api/forecast-runs`. Column-level definitions for those tables are deferred (database-design §20).

## Phase 1 (this phase)

### Request

`POST /api/forecast-runs` is coordinator-only. The body is only the two term ids:

```json
{
  "targetTermId": 12,
  "informationCutoffTermId": 9
}
```

| JSON field | Column written | Rule |
|---|---|---|
| `targetTermId` | `offering_forecast.academic_term_id` | The term being planned. Must already exist |
| `informationCutoffTermId` | `offering_forecast.information_cutoff_term_id` | Last term whose grades the run may read. Reject the call when this term does not precede the target |

A spring run never reads the preceding fall’s grades. For a spring target the cutoff is the term before that fall. The service does not guess a cutoff.

The response includes `forecast_run_id` and a count of students who contributed no sheet demand because `track_id`, `english_path`, or `math_path` is null. That count is only in the response. Persisting it would be a schema change for Backend A. No template is guessed (Nile ask 2).

### What the engine reads

Backend B calls Backend A’s parameterised SQL. It does not edit those files.

| Query | Used for |
|---|---|
| `forecast_students` | Who is in the run |
| `student_attempts_before_cutoff` | Attempts the cutoff allows. Input is `attempt_state`, not the file `status` |
| `template_slots_ordered` | Official sheet order for the cap walk |
| `course_requisites_grouped` | AND inside one group number, OR across groups |
| `credit_limits_for_bylaw` | Priority walk, including a null maximum |
| `course_components` | Which of lecture, tutorial, and lab exist, and `lab_kind` |
| `course_attempt_stats_before_cutoff` | Attempts and passes per old course. Rates need at least 30 prior attempts |
| `course_offering_history` | Term types that have attempts. Rule 1 fires only when this shows a pattern. With no history it never fires |
| `grade_scale_for_bylaw` | Letter and CGPA in application code. Not the pass test |

Pass test, requisite evaluation, and `deriveAttemptState` are Node functions. Enrollment `percentage` and `final_exam_percentage` feed the pass test. `attempt_state` is what the ordered rules see. Details are in [evidence-format.md](/cursor/stores/bc-a41049f8-3811-4a24-a05c-7bb12ec21663/docs/evidence-format.md).

Rules 0–7 run in order. The first match wins. Rules 4 and 6 run only for the old bylaw when that course has at least 30 prior attempts. Otherwise the course’s `method` is `simple_count`. Any 2025 course is `simple_count`. An unknown repeat intention is unresolved. Lines are stored only for rules 1–6 and for unresolved pairs. Rules 0 and 7 (`p = 0`) are not stored.

### What one run writes

One database transaction, using `insert_offering_forecast` and `insert_forecast_line`:

1. Pick a new `forecast_run_id` (uuid) and keep the cutoff from the body.
2. For each student and course, apply the ordered rules. Insert a `forecast_line` when the pair reached rules 1–6 or was left unresolved.
3. Walk that student’s official sheet in order against the matched `credit_limit` maximum. Set `trimmed_by_cap` when the course would exceed the maximum.
4. Sum the remaining `p` values into one `offering_forecast` row per course. Fill class sizes, implied sections, and the four incomplete counts.

Unique `(forecast_run_id, course_id)`. A later run inserts new rows. It does not update the old run. `created_at` on `offering_forecast` is the time of the run.

Three cases are not guessed (§17a):

| Case | Effect |
|---|---|
| Null maximum | Nothing is trimmed for that student and term. Counted in `null_cap_student_count` |
| Null `counts_toward_registration_cap` | The candidate is neither added to the running total nor dropped. Counted in `cap_flag_unknown_student_count` |
| Unresolved pair | Not a trim candidate and not part of the sum. Counted in `unresolved_pair_count` |

`upsert_term` is the data-access write for creating a term from a registration row. It is not a forecast output. The run does not invent a term.

The explanation service writes none of these tables.

### Dashboard output

`GET /api/forecast-runs/:runId/courses` feeds the demand table. Show null as "—", never as 0.

| Field | Source | What to show |
|---|---|---|
| Course | `course` | Code and title for that bylaw |
| Bylaw | `bylaw.code` | `old_cs` or `bylaw_2025`. Never add the two headcounts together |
| `method` | `offering_forecast.method` | `rates` or `simple_count` |
| Headcount | `predicted_headcount` | Unrounded sum of remaining `p`, two decimal places (`numeric(10,2)`) |
| Implied lecture / tutorial / lab | `implied_*_sections` | Integer, or "—" when null. Old courses have no `course_component` rows, so all three are null and the headcount still shows |
| Incomplete | `is_incomplete` plus the four counts | Badge when `is_incomplete` is true, with every count that is greater than 0 |
| Decision status | `offering_decision` for that course and term | Separate from the forecast row. Empty until a coordinator saves flags |

`is_incomplete` is generated and stored. It is true when any of these four is greater than 0:

| Count | Who it counts |
|---|---|
| `unresolved_pair_count` | Students whose `p` for this course is unresolved |
| `null_cap_student_count` | Students on this course whose matched maximum is null (2025, CGPA 3.0 up to but not including 3.3, not graduating) |
| `first_year_undefined_student_count` | Old-bylaw students above 3.0 held at 19 because “first year” is undefined |
| `cap_flag_unknown_student_count` | Students whose cap trim met a course with a null `counts_toward_registration_cap` |

Class sizes stored on the row, from config, not from the bylaw: lecture 60, tutorial 30, `physics_circuits` lab 15, `computing` lab 30. A missing component stores null for that class size. Implied sections are `ceil(predicted_headcount ÷ class size)`, and null when the class size is null.

Fixture check (report Table 10 shape): `1.00 + 0.80 + 0.25 = 2.05` headcount, which implies 1 lecture section. Tests compare a second run with the first. Ids and timestamps may differ. The other columns may not.

Course detail uses the aggregate in [evidence-format.md](/cursor/stores/bc-a41049f8-3811-4a24-a05c-7bb12ec21663/docs/evidence-format.md). It does not list student ids.

### Decision is a separate PUT

`PUT /api/offering-decisions` writes `offering_decision`. It is not returned as part of the forecast calculation, and the forecast service does not insert it.

| Written by the server | Rule |
|---|---|
| `lecture_open`, `tutorial_open`, `lab_open` | Yes/no per component. Null until decided. Null for a component the course does not have. Old courses have no component rows yet, so all three flags stay available |
| `offering_forecast_id` | Optional. The forecast the coordinator looked at |
| `decision_notes` | Optional reason when the opening differs from the implied counts. The form requires notes in that case |
| `approved_by_user_id`, `approved_by_name`, `approved_at` | Taken from the session when any flag is set. The browser cannot send the approver |

The table stores three yes/no flags. It does not store section counts, and the coordinator does not type a count in place of the formula. The account must have the `coordinator` role. The service checks that. A check constraint cannot.

### Synthetic data, no MAE, 2025 sheet demand

| Fact | What Phase 1 does |
|---|---|
| Demo students | Synthetic ids `SYN-0001…` in `db/fixtures/test/`. Loaded only into a database whose name ends in `_test` or `_dev`. Never by `db:seed` |
| Banner | When the API is serving that synthetic set, the dashboard shows `SyntheticDataBanner`. Forecast numbers are arithmetic on fixtures, not institutional results |
| MAE | Not computed and not displayed. The Table 11 evaluation row is blocked on Nile ask 1. `is_evaluation_replay` stays false |
| 2025 sheet demand | Blocked. There are no 2025 `plan_template` or `plan_slot` rows (Nile ask 3). A 2025 student has no baseline sheet demand until that plan arrives. 2025 courses still use `simple_count` if a run reaches them. Their headcount is never added to an old-bylaw headcount |
| Other nulls that stay null | Old senior minimum (do not seed 106), old “first year” (never matched), `max_attempts`, `min_students_to_open`, training and internship `counts_toward_registration_cap`, `course_equivalence` (empty) |
