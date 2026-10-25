import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Button, Checkbox, Dialog, Field, Input, Select } from "@/components/ui";
import { formatNumber } from "@/utils/format";
import { bylawName, POPULATIONS, TERM_TYPES } from "./constants";

const toText = (value) => (value === null || value === undefined ? "" : String(value));
const toNullable = (value) => (value.trim() === "" ? null : Number(value));

/**
 * Create (no `rule`) or edit (`rule`) a credit-limit row. An empty maximum stays null:
 * it means the source never stated it, and is never sent as 0.
 * Server field errors (error.details.fields) are shown under the matching input.
 */
export function CreditLimitFormDialog({
  open,
  rule,
  bylaws,
  defaultBylawId,
  nextPriority,
  onClose,
  onSubmit,
  submitting,
  error,
}) {
  const { t } = useTranslation(["adminCreditLimits", "common"]);
  const editing = Boolean(rule);
  const [values, setValues] = useState({
    bylaw_id: String(rule?.bylaw_id ?? defaultBylawId ?? ""),
    priority: String(rule?.priority ?? nextPriority ?? 1),
    term_type: rule?.term_type ?? "fall_spring",
    population: rule?.population ?? "default",
    min_cgpa: toText(rule?.min_cgpa),
    max_cgpa: toText(rule?.max_cgpa),
    min_cgpa_inclusive: rule?.min_cgpa_inclusive ?? true,
    max_cgpa_inclusive: rule?.max_cgpa_inclusive ?? false,
    max_credits: toText(rule?.max_credits),
    min_credits: toText(rule?.min_credits),
    source_reference: rule?.source_reference ?? "",
  });
  const [touched, setTouched] = useState(false);

  const serverFields = error?.details?.fields ?? {};
  const required = t("common:states.required");
  const cgpa = (value) => {
    if (value.trim() === "") return null;
    const n = Number(value);
    return Number.isNaN(n) || n < 0 || n > 4 ? t("fieldErrors.between_0_and_4") : null;
  };
  const credits = (value) => {
    if (value.trim() === "") return null;
    const n = Number(value);
    return !Number.isInteger(n) || n < 0 ? t("fieldErrors.must_be_zero_or_more") : null;
  };
  const clientErrors = {
    priority:
      !Number.isInteger(Number(values.priority)) || Number(values.priority) < 1
        ? t("fieldErrors.must_be_positive")
        : null,
    min_cgpa: cgpa(values.min_cgpa),
    max_cgpa:
      cgpa(values.max_cgpa) ??
      (values.min_cgpa.trim() &&
      values.max_cgpa.trim() &&
      Number(values.min_cgpa) >= Number(values.max_cgpa)
        ? t("fieldErrors.must_exceed_min_cgpa")
        : null),
    max_credits: credits(values.max_credits),
    min_credits:
      credits(values.min_credits) ??
      (values.min_credits.trim() &&
      values.max_credits.trim() &&
      Number(values.min_credits) > Number(values.max_credits)
        ? t("fieldErrors.must_not_exceed_max_credits")
        : null),
    source_reference: values.source_reference.trim() ? null : required,
  };
  const serverError = (field) =>
    serverFields[field]
      ? t(`fieldErrors.${serverFields[field]}`, { defaultValue: error.message })
      : null;
  const show = (field) => (touched ? clientErrors[field] : null) ?? serverError(field);

  const set = (field) => (event) => setValues((v) => ({ ...v, [field]: event.target.value }));
  const toggle = (field) => (event) => setValues((v) => ({ ...v, [field]: event.target.checked }));

  const submit = (event) => {
    event.preventDefault();
    setTouched(true);
    if (Object.values(clientErrors).some(Boolean)) return;
    onSubmit({
      bylaw_id: Number(values.bylaw_id),
      priority: Number(values.priority),
      term_type: values.term_type,
      population: values.population,
      min_cgpa: toNullable(values.min_cgpa),
      max_cgpa: toNullable(values.max_cgpa),
      min_cgpa_inclusive: values.min_cgpa.trim() ? values.min_cgpa_inclusive : false,
      max_cgpa_inclusive: values.max_cgpa.trim() ? values.max_cgpa_inclusive : false,
      max_credits: toNullable(values.max_credits),
      min_credits: toNullable(values.min_credits),
      source_reference: values.source_reference.trim(),
    });
  };

  const noLimit = !values.max_credits.trim() && !values.min_credits.trim();
  const hasFieldErrors = Object.keys(serverFields).length > 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="lg"
      title={
        editing
          ? t("form.editTitle", {
              priority: formatNumber(rule.priority),
              bylaw: bylawName(t, rule.bylaw_code),
            })
          : t("form.createTitle")
      }
      description={t("form.description")}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t("common:actions.cancel")}
          </Button>
          <Button type="submit" form="credit-limit-form" loading={submitting}>
            {editing ? t("form.save") : t("form.create")}
          </Button>
        </>
      }
    >
      <form
        id="credit-limit-form"
        noValidate
        onSubmit={submit}
        className="grid gap-4 sm:grid-cols-2"
      >
        <Field label={t("form.bylaw")} error={show("bylaw_id")} required>
          {(props) => (
            <Select
              {...props}
              disabled={editing}
              value={values.bylaw_id}
              onChange={set("bylaw_id")}
              options={bylaws.map((bylaw) => ({
                value: String(bylaw.bylaw_id),
                label: bylawName(t, bylaw.bylaw_code),
              }))}
            />
          )}
        </Field>
        <Field
          label={t("form.priority")}
          hint={t("form.priorityHint")}
          error={show("priority")}
          required
        >
          {(props) => (
            <Input
              {...props}
              type="number"
              inputMode="numeric"
              min={1}
              value={values.priority}
              onChange={set("priority")}
            />
          )}
        </Field>
        <Field label={t("form.termType")} error={show("term_type")}>
          {(props) => (
            <Select
              {...props}
              value={values.term_type}
              onChange={set("term_type")}
              options={TERM_TYPES.map((term) => ({ value: term, label: t(`terms.${term}`) }))}
            />
          )}
        </Field>
        <Field label={t("form.population")} error={show("population")}>
          {(props) => (
            <Select
              {...props}
              value={values.population}
              onChange={set("population")}
              options={POPULATIONS.map((population) => ({
                value: population,
                label: t(`populations.${population}`),
              }))}
            />
          )}
        </Field>

        <fieldset className="grid gap-4 rounded-lg border border-outline-variant/70 p-4 sm:col-span-2 sm:grid-cols-2">
          <legend className="px-1 text-label-md font-semibold text-on-surface">
            {t("form.cgpaBand")}
          </legend>
          <div className="flex flex-col gap-2">
            <Field label={t("form.minCgpa")} hint={t("form.emptyNoBound")} error={show("min_cgpa")}>
              {(props) => (
                <Input
                  {...props}
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min={0}
                  max={4}
                  value={values.min_cgpa}
                  onChange={set("min_cgpa")}
                />
              )}
            </Field>
            <Checkbox
              label={t("form.inclusive")}
              checked={values.min_cgpa_inclusive}
              disabled={!values.min_cgpa.trim()}
              onChange={toggle("min_cgpa_inclusive")}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Field label={t("form.maxCgpa")} hint={t("form.emptyNoBound")} error={show("max_cgpa")}>
              {(props) => (
                <Input
                  {...props}
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min={0}
                  max={4}
                  value={values.max_cgpa}
                  onChange={set("max_cgpa")}
                />
              )}
            </Field>
            <Checkbox
              label={t("form.inclusive")}
              checked={values.max_cgpa_inclusive}
              disabled={!values.max_cgpa.trim()}
              onChange={toggle("max_cgpa_inclusive")}
            />
          </div>
        </fieldset>

        <Field
          label={t("form.maxCredits")}
          hint={t("form.maxCreditsHint")}
          error={show("max_credits")}
        >
          {(props) => (
            <Input
              {...props}
              type="number"
              inputMode="numeric"
              min={0}
              value={values.max_credits}
              onChange={set("max_credits")}
            />
          )}
        </Field>
        <Field
          label={t("form.minCredits")}
          hint={t("form.minCreditsHint")}
          error={show("min_credits")}
        >
          {(props) => (
            <Input
              {...props}
              type="number"
              inputMode="numeric"
              min={0}
              value={values.min_credits}
              onChange={set("min_credits")}
            />
          )}
        </Field>
        {noLimit && (
          <Alert tone="warning" className="sm:col-span-2">
            {values.population === "credits_remaining_below_minimum"
              ? t("form.floorWaivedNote")
              : t("form.unstatedNote")}
          </Alert>
        )}
        <Field
          label={t("form.sourceReference")}
          error={show("source_reference")}
          required
          className="sm:col-span-2"
        >
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
