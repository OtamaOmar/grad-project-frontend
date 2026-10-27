import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Dialog, Field, Input, Select, Textarea } from "@/components/ui";
import { cn } from "@/utils/cn";
import { formatNumber } from "@/utils/format";
import { useBylawCourses, useElectivePools } from "./useStudyPlans";

const YEARS = [1, 2, 3, 4, 5, 6];
const TERMS = ["fall", "spring"];

/**
 * Add (no `slot`) or edit (`slot`) one plan slot. A slot targets exactly one course or one
 * elective pool (XOR): the kind toggle keeps only one target in the payload.
 * Server field errors (400 VALIDATION_ERROR, 409 SLOT_POSITION_TAKEN) show under the inputs.
 * Mount with a `key` per slot so the form resets.
 */
export function SlotFormDialog({
  open,
  template,
  slot,
  defaults,
  onClose,
  onSubmit,
  submitting,
  error,
}) {
  const { t } = useTranslation(["adminStudyPlans", "common"]);
  const editing = Boolean(slot);
  const [values, setValues] = useState({
    study_year: String(slot?.study_year ?? defaults?.study_year ?? 1),
    term_type: slot?.term_type ?? defaults?.term_type ?? "fall",
    position: String(slot?.position ?? defaults?.position ?? 1),
    kind: slot?.elective_pool_id ? "elective_pool" : "course",
    course_id: slot?.course_id ? String(slot.course_id) : "",
    elective_pool_id: slot?.elective_pool_id ? String(slot.elective_pool_id) : "",
    source_reference: slot?.source_reference ?? "",
  });
  const [touched, setTouched] = useState(false);

  const courses = useBylawCourses(template.bylaw_id, { enabled: open });
  const pools = useElectivePools(template.bylaw_id, { enabled: open });

  const serverFields = error?.details?.fields ?? {};
  const serverMessage = (field) => {
    const code = serverFields[field];
    if (!code) return null;
    if (code === "taken" && error.code === "SLOT_POSITION_TAKEN") return t("form.errors.taken");
    return t(`form.errors.${code}`, { defaultValue: error.message });
  };

  const required = t("common:states.required");
  const position = Number(values.position);
  const local = {
    position:
      !Number.isInteger(position) || position < 1 ? t("form.errors.must_be_positive") : null,
    course_id: values.kind === "course" && !values.course_id ? required : null,
    elective_pool_id: values.kind === "elective_pool" && !values.elective_pool_id ? required : null,
    source_reference: !values.source_reference.trim() ? required : null,
  };
  const show = (field) => (touched ? local[field] : null) ?? serverMessage(field);

  const set = (field) => (event) => setValues((v) => ({ ...v, [field]: event.target.value }));

  const submit = (event) => {
    event.preventDefault();
    setTouched(true);
    if (Object.values(local).some(Boolean)) return;
    const target =
      values.kind === "course"
        ? { course_id: Number(values.course_id), elective_pool_id: null }
        : { course_id: null, elective_pool_id: Number(values.elective_pool_id) };
    onSubmit({
      study_year: Number(values.study_year),
      term_type: values.term_type,
      position,
      ...target,
      source_reference: values.source_reference.trim(),
    });
  };

  const handledFields = [
    "study_year",
    "term_type",
    "position",
    "course_id",
    "elective_pool_id",
    "source_reference",
  ];
  const generalError = error && !handledFields.some((field) => serverFields[field]);

  const courseOptions = (courses.data?.items ?? []).map((course) => ({
    value: String(course.id),
    label: `${course.code} · ${course.title} (${t("creditsShort", { value: formatNumber(course.credits) })})`,
  }));
  const poolOptions = (pools.data?.items ?? []).map((pool) => ({
    value: String(pool.id),
    label: `${pool.name} · ${t("pool.choose", { value: formatNumber(pool.choose_count) })}`,
  }));

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? t("form.editTitle") : t("form.createTitle")}
      description={t("form.description", { sheet: template.source_sheet })}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t("common:actions.cancel")}
          </Button>
          <Button type="submit" form="slot-form" loading={submitting}>
            {editing ? t("form.save") : t("form.create")}
          </Button>
        </>
      }
    >
      <form id="slot-form" noValidate onSubmit={submit} className="grid gap-4 sm:grid-cols-3">
        <Field label={t("form.year")} error={show("study_year")} required>
          {(props) => (
            <Select
              {...props}
              value={values.study_year}
              onChange={set("study_year")}
              options={YEARS.map((year) => ({
                value: String(year),
                label: t("yearN", { n: formatNumber(year) }),
              }))}
            />
          )}
        </Field>
        <Field label={t("form.term")} error={show("term_type")} required>
          {(props) => (
            <Select
              {...props}
              value={values.term_type}
              onChange={set("term_type")}
              options={TERMS.map((term) => ({ value: term, label: t(`termType.${term}`) }))}
            />
          )}
        </Field>
        <Field label={t("form.position")} error={show("position")} required>
          {(props) => (
            <Input
              {...props}
              type="number"
              min={1}
              inputMode="numeric"
              value={values.position}
              onChange={set("position")}
            />
          )}
        </Field>

        <fieldset className="sm:col-span-3">
          <legend className="mb-1.5 text-label-md font-semibold text-on-surface">
            {t("form.kind")}
          </legend>
          <div
            role="radiogroup"
            className="grid grid-cols-2 gap-1 rounded-lg bg-surface-container-low p-1"
          >
            {["course", "elective_pool"].map((kind) => (
              <label
                key={kind}
                className={cn(
                  "flex cursor-pointer items-center justify-center gap-2 rounded-md px-3 py-2 text-label-md font-semibold transition-colors",
                  "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary",
                  values.kind === kind
                    ? "bg-surface-container-lowest text-primary shadow-card"
                    : "text-on-surface-variant hover:text-on-surface",
                )}
              >
                <input
                  type="radio"
                  name="slot-kind"
                  value={kind}
                  checked={values.kind === kind}
                  onChange={set("kind")}
                  className="sr-only"
                />
                {t(`slotKind.${kind}`)}
              </label>
            ))}
          </div>
          <p className="mt-1.5 text-body-sm text-on-surface-variant">{t("form.kindHint")}</p>
        </fieldset>

        {values.kind === "course" ? (
          <Field
            label={t("form.course")}
            error={show("course_id")}
            hint={courses.isError ? courses.error.message : null}
            required
            className="sm:col-span-3"
          >
            {(props) => (
              <Select
                {...props}
                disabled={courses.isPending}
                value={values.course_id}
                onChange={set("course_id")}
                options={[
                  {
                    value: "",
                    label: courses.isPending ? t("common:states.loading") : t("form.pickCourse"),
                  },
                  ...courseOptions,
                ]}
              />
            )}
          </Field>
        ) : (
          <Field
            label={t("form.pool")}
            error={show("elective_pool_id")}
            hint={pools.isError ? pools.error.message : null}
            required
            className="sm:col-span-3"
          >
            {(props) => (
              <Select
                {...props}
                disabled={pools.isPending}
                value={values.elective_pool_id}
                onChange={set("elective_pool_id")}
                options={[
                  {
                    value: "",
                    label: pools.isPending ? t("common:states.loading") : t("form.pickPool"),
                  },
                  ...poolOptions,
                ]}
              />
            )}
          </Field>
        )}

        <Field
          label={t("form.sourceReference")}
          hint={t("form.sourceReferenceHint")}
          error={show("source_reference")}
          required
          className="sm:col-span-3"
        >
          {(props) => (
            <Textarea
              {...props}
              rows={2}
              value={values.source_reference}
              onChange={set("source_reference")}
            />
          )}
        </Field>

        {generalError && (
          <p role="alert" className="text-body-sm text-error sm:col-span-3">
            {error.message}
          </p>
        )}
      </form>
    </Dialog>
  );
}
