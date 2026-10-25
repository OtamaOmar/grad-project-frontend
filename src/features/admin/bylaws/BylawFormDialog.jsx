import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Dialog, Field, Input, Select, Textarea } from "@/components/ui";

const STATUSES = ["draft", "active", "retired"];

const toText = (value) => (value === null || value === undefined ? "" : String(Number(value)));
const toNullableNumber = (value) => (value.trim() === "" ? null : Number(value));

/**
 * Create (no `bylaw`) or edit (`bylaw`) a bylaw. Server field errors
 * (error.details.fields) are shown under the matching input.
 * Mount it with a `key` per bylaw so the form resets between bylaws.
 */
export function BylawFormDialog({ open, bylaw, onClose, onSubmit, submitting, error }) {
  const { t } = useTranslation(["adminBylaws", "common"]);
  const editing = Boolean(bylaw);
  const [values, setValues] = useState({
    code: bylaw?.code ?? "",
    name: bylaw?.name ?? "",
    description: bylaw?.description ?? "",
    graduation_credits: toText(bylaw?.graduation_credits),
    training_credits_excluded_from_gpa: toText(bylaw?.training_credits_excluded_from_gpa),
    pass_percentage: toText(bylaw?.pass_percentage),
    final_exam_min_percentage: toText(bylaw?.final_exam_min_percentage),
    status: bylaw?.status ?? "draft",
    effective_from_cohort: toText(bylaw?.effective_from_cohort),
    source_reference: bylaw?.source_reference ?? "",
  });
  const [touched, setTouched] = useState(false);

  const serverFields = error?.details?.fields ?? {};
  const required = t("common:states.required");
  const percentage = (value, optional) => {
    if (value.trim() === "") return optional ? null : required;
    const n = Number(value);
    return Number.isNaN(n) || n < 0 || n > 100 ? t("fieldErrors.between_0_and_100") : null;
  };
  const integer = (value, { optional, min }) => {
    if (value.trim() === "") return optional ? null : required;
    const n = Number(value);
    return !Number.isInteger(n) || n < min
      ? t(min > 0 ? "fieldErrors.must_be_positive" : "fieldErrors.must_be_zero_or_more")
      : null;
  };
  const clientErrors = {
    code: !values.code.trim()
      ? required
      : !/^[a-z0-9_]{2,32}$/.test(values.code.trim())
        ? t("fieldErrors.invalid_code")
        : null,
    name: values.name.trim() ? null : required,
    graduation_credits: integer(values.graduation_credits, { min: 1 }),
    training_credits_excluded_from_gpa: integer(values.training_credits_excluded_from_gpa, {
      optional: true,
      min: 0,
    }),
    pass_percentage: percentage(values.pass_percentage, false),
    final_exam_min_percentage: percentage(values.final_exam_min_percentage, true),
    effective_from_cohort: (() => {
      const n = Number(values.effective_from_cohort);
      if (!values.effective_from_cohort.trim()) return required;
      return !Number.isInteger(n) || n < 1990 || n > 2100
        ? t("fieldErrors.between_1990_and_2100")
        : null;
    })(),
    source_reference: values.source_reference.trim() ? null : required,
  };
  const serverError = (field) =>
    serverFields[field]
      ? t(`fieldErrors.${serverFields[field]}`, { defaultValue: error.message })
      : null;
  const show = (field) => (touched ? clientErrors[field] : null) ?? serverError(field);

  const set = (field) => (event) => setValues((v) => ({ ...v, [field]: event.target.value }));

  const submit = (event) => {
    event.preventDefault();
    setTouched(true);
    if (Object.values(clientErrors).some(Boolean)) return;
    onSubmit({
      code: values.code.trim(),
      name: values.name.trim(),
      description: values.description.trim() || null,
      graduation_credits: Number(values.graduation_credits),
      training_credits_excluded_from_gpa: toNullableNumber(
        values.training_credits_excluded_from_gpa,
      ),
      pass_percentage: Number(values.pass_percentage),
      final_exam_min_percentage: toNullableNumber(values.final_exam_min_percentage),
      status: values.status,
      effective_from_cohort: Number(values.effective_from_cohort),
      source_reference: values.source_reference.trim(),
    });
  };

  const hasFieldErrors = Object.keys(serverFields).length > 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title={editing ? t("form.editTitle", { name: bylaw.name }) : t("form.createTitle")}
      description={t("form.description")}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t("common:actions.cancel")}
          </Button>
          <Button type="submit" form="bylaw-form" loading={submitting}>
            {editing ? t("form.save") : t("form.create")}
          </Button>
        </>
      }
    >
      <form id="bylaw-form" noValidate onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label={t("form.code")} hint={t("form.codeHint")} error={show("code")} required>
          {(props) => (
            <Input
              {...props}
              dir="ltr"
              autoCapitalize="none"
              spellCheck={false}
              value={values.code}
              onChange={set("code")}
            />
          )}
        </Field>
        <Field label={t("form.status")} error={show("status")}>
          {(props) => (
            <Select
              {...props}
              value={values.status}
              onChange={set("status")}
              options={STATUSES.map((status) => ({
                value: status,
                label: t(`status.${status}`),
              }))}
            />
          )}
        </Field>
        <Field label={t("form.name")} error={show("name")} required className="sm:col-span-2">
          {(props) => <Input {...props} value={values.name} onChange={set("name")} />}
        </Field>
        <Field label={t("form.descriptionField")} className="sm:col-span-2">
          {(props) => (
            <Textarea
              {...props}
              rows={2}
              value={values.description}
              onChange={set("description")}
            />
          )}
        </Field>
        <Field label={t("form.graduationCredits")} error={show("graduation_credits")} required>
          {(props) => (
            <Input
              {...props}
              type="number"
              inputMode="numeric"
              min={1}
              value={values.graduation_credits}
              onChange={set("graduation_credits")}
            />
          )}
        </Field>
        <Field
          label={t("form.trainingCredits")}
          hint={t("form.optionalNullHint")}
          error={show("training_credits_excluded_from_gpa")}
        >
          {(props) => (
            <Input
              {...props}
              type="number"
              inputMode="numeric"
              min={0}
              value={values.training_credits_excluded_from_gpa}
              onChange={set("training_credits_excluded_from_gpa")}
            />
          )}
        </Field>
        <Field label={t("form.passPercentage")} error={show("pass_percentage")} required>
          {(props) => (
            <Input
              {...props}
              type="number"
              inputMode="decimal"
              step="0.01"
              min={0}
              max={100}
              value={values.pass_percentage}
              onChange={set("pass_percentage")}
            />
          )}
        </Field>
        <Field
          label={t("form.finalExamMin")}
          hint={t("form.optionalNullHint")}
          error={show("final_exam_min_percentage")}
        >
          {(props) => (
            <Input
              {...props}
              type="number"
              inputMode="decimal"
              step="0.01"
              min={0}
              max={100}
              value={values.final_exam_min_percentage}
              onChange={set("final_exam_min_percentage")}
            />
          )}
        </Field>
        <Field
          label={t("form.effectiveFromCohort")}
          hint={t("form.effectiveFromCohortHint")}
          error={show("effective_from_cohort")}
          required
        >
          {(props) => (
            <Input
              {...props}
              type="number"
              inputMode="numeric"
              value={values.effective_from_cohort}
              onChange={set("effective_from_cohort")}
            />
          )}
        </Field>
        <Field label={t("form.sourceReference")} error={show("source_reference")} required>
          {(props) => (
            <Input
              {...props}
              placeholder={t("form.sourceReferencePlaceholder")}
              value={values.source_reference}
              onChange={set("source_reference")}
            />
          )}
        </Field>
        {error && !hasFieldErrors && (
          <p role="alert" className="text-body-sm text-error sm:col-span-2">
            {error.message}
          </p>
        )}
      </form>
    </Dialog>
  );
}
