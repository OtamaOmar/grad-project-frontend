import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Button, Dialog, Field, Input, Select, Switch } from "@/components/ui";
import { formatNumber } from "@/utils/format";
import { formatAcademicYear, formatYear, TERM_STATUSES, TERM_TYPES } from "./termMeta";

const FIELDS = [
  "academic_year",
  "term_type",
  "status",
  "starts_on",
  "ends_on",
  "registration_locked",
];

/**
 * Create (no `term`) or edit (`term`) an academic term. Server rules surface under the
 * matching input: 409 TERM_EXISTS (year + type), 409 ACTIVE_TERM_EXISTS (status),
 * 400 VALIDATION_ERROR fields. 409 TERM_IN_USE (renaming a referenced term) shows as an alert.
 * Mount with a `key` per term so the form resets.
 */
export function TermFormDialog({ open, term, onClose, onSubmit, submitting, error }) {
  const { t } = useTranslation(["adminTerms", "common"]);
  const editing = Boolean(term);
  const [values, setValues] = useState({
    academic_year: String(term?.academic_year ?? new Date().getFullYear() + 1),
    term_type: term?.term_type ?? "fall",
    status: term?.status ?? "draft",
    starts_on: term?.starts_on ?? "",
    ends_on: term?.ends_on ?? "",
    registration_locked: term?.registration_locked ?? false,
  });
  const [touched, setTouched] = useState(false);

  // Enrollments, forecasts or decisions point at a referenced term: its identity is fixed.
  const identityFixed = editing && term.is_referenced;

  const serverFields = error?.details?.fields ?? {};
  const serverMessage = (field) => {
    const code = serverFields[field];
    if (!code) return null;
    return t(`form.errors.${code}`, { defaultValue: error.message });
  };

  const year = Number(values.academic_year);
  const local = {
    academic_year:
      !Number.isInteger(year) || year < 1990 || year > 2100
        ? t("form.errors.between_1990_and_2100")
        : null,
    ends_on:
      values.starts_on && values.ends_on && values.starts_on >= values.ends_on
        ? t("form.errors.must_be_after_starts_on")
        : null,
  };
  const show = (field) => (touched ? local[field] : null) ?? serverMessage(field);

  const set = (field) => (event) => {
    const value = event.target.value;
    setValues((v) => ({
      ...v,
      [field]: value,
      // A closed term must keep registration locked (API rule).
      ...(field === "status" && value === "closed" ? { registration_locked: true } : {}),
    }));
  };

  const submit = (event) => {
    event.preventDefault();
    setTouched(true);
    if (Object.values(local).some(Boolean)) return;
    const payload = {
      status: values.status,
      starts_on: values.starts_on || null,
      ends_on: values.ends_on || null,
      registration_locked: values.registration_locked,
    };
    if (!identityFixed) {
      payload.academic_year = year;
      payload.term_type = values.term_type;
    }
    onSubmit(payload);
  };

  const generalError = error && !FIELDS.some((field) => serverFields[field]);
  const related = error?.details?.related;
  const ayStart = values.term_type === "fall" ? year : year - 1;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={
        editing
          ? t("form.editTitle", {
              term: t("termLabel", {
                type: t(`termType.${term.term_type}`),
                year: formatYear(term.academic_year),
              }),
            })
          : t("form.createTitle")
      }
      description={editing ? null : t("form.createDescription")}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t("common:actions.cancel")}
          </Button>
          <Button type="submit" form="term-form" loading={submitting}>
            {editing ? t("form.save") : t("form.create")}
          </Button>
        </>
      }
    >
      <form id="term-form" noValidate onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        {identityFixed && (
          <Alert tone="info" icon="link" className="sm:col-span-2">
            {t("form.identityFixed", {
              enrollments: formatNumber(term.enrollment_count),
              forecasts: formatNumber(term.forecast_run_count),
              decisions: formatNumber(term.decision_count),
            })}
          </Alert>
        )}
        <Field
          label={t("form.year")}
          hint={
            Number.isInteger(year) && !local.academic_year
              ? t("form.yearHint", { label: formatAcademicYear(ayStart) })
              : null
          }
          error={show("academic_year")}
          required
        >
          {(props) => (
            <Input
              {...props}
              type="number"
              inputMode="numeric"
              min={1990}
              max={2100}
              disabled={identityFixed}
              value={values.academic_year}
              onChange={set("academic_year")}
            />
          )}
        </Field>
        <Field label={t("form.type")} error={show("term_type")} required>
          {(props) => (
            <Select
              {...props}
              disabled={identityFixed}
              value={values.term_type}
              onChange={set("term_type")}
              options={TERM_TYPES.map((type) => ({ value: type, label: t(`termType.${type}`) }))}
            />
          )}
        </Field>
        <Field
          label={t("form.status")}
          hint={t("form.statusHint")}
          error={show("status")}
          className="sm:col-span-2"
        >
          {(props) => (
            <Select
              {...props}
              value={values.status}
              onChange={set("status")}
              options={TERM_STATUSES.map((status) => ({
                value: status,
                label: t(`status.${status}`),
              }))}
            />
          )}
        </Field>
        <Field label={t("form.startsOn")} error={show("starts_on")}>
          {(props) => (
            <Input {...props} type="date" value={values.starts_on} onChange={set("starts_on")} />
          )}
        </Field>
        <Field label={t("form.endsOn")} error={show("ends_on")}>
          {(props) => (
            <Input {...props} type="date" value={values.ends_on} onChange={set("ends_on")} />
          )}
        </Field>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Switch
            label={t("form.registrationLocked")}
            checked={values.registration_locked}
            disabled={values.status === "closed"}
            onChange={(checked) => setValues((v) => ({ ...v, registration_locked: checked }))}
          />
          <p
            className={
              serverFields.registration_locked
                ? "text-body-sm text-error"
                : "text-body-sm text-on-surface-variant"
            }
          >
            {serverMessage("registration_locked") ??
              (values.status === "closed"
                ? t("form.closedLocked")
                : t("form.registrationLockedHint"))}
          </p>
        </div>
        {generalError && (
          <p role="alert" className="text-body-sm text-error sm:col-span-2">
            {error.code === "TERM_IN_USE" && related
              ? t("form.errors.term_in_use", {
                  enrollments: formatNumber(related.enrollment_count),
                  forecasts: formatNumber(related.forecast_run_count),
                  decisions: formatNumber(related.decision_count),
                })
              : error.message}
          </p>
        )}
      </form>
    </Dialog>
  );
}
