import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Checkbox, Dialog, Field, Input, Select, Textarea } from "@/components/ui";
import { BYLAW_SCOPES, GAP_CATEGORIES, GAP_ENTITIES, GAP_SEVERITIES } from "./constants";

/**
 * Record a new data gap. Nothing here fills in a missing value: the form only describes the
 * hole and where it came from. Server field errors (error.details.fields) show under inputs.
 */
export function DataGapFormDialog({ open, onClose, onSubmit, submitting, error }) {
  const { t } = useTranslation(["adminDataGaps", "common"]);
  const [values, setValues] = useState({
    category: GAP_CATEGORIES[0],
    affected_entity: GAP_ENTITIES[0],
    severity: "medium",
    description: "",
    source_reference: "",
    notes: "",
    bylaw_scope: [],
  });
  const [touched, setTouched] = useState(false);

  const serverFields = error?.details?.fields ?? {};
  const serverError = (field) =>
    serverFields[field] === "required"
      ? t("common:states.required")
      : serverFields[field]
        ? error.message
        : null;
  const descriptionError = !values.description.trim() ? t("common:states.required") : null;
  const show = (field) =>
    (field === "description" && touched ? descriptionError : null) ?? serverError(field);

  const set = (field) => (event) => setValues((v) => ({ ...v, [field]: event.target.value }));
  const toggleScope = (code) => (event) =>
    setValues((v) => ({
      ...v,
      bylaw_scope: event.target.checked
        ? [...v.bylaw_scope, code]
        : v.bylaw_scope.filter((item) => item !== code),
    }));

  const submit = (event) => {
    event.preventDefault();
    setTouched(true);
    if (descriptionError) return;
    onSubmit({
      category: values.category,
      affected_entity: values.affected_entity,
      severity: values.severity,
      description: values.description.trim(),
      source_reference: values.source_reference.trim() || undefined,
      notes: values.notes.trim() || undefined,
      bylaw_scope: values.bylaw_scope.length ? values.bylaw_scope : undefined,
    });
  };

  const hasFieldError = Object.keys(serverFields).length > 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t("form.createTitle")}
      description={t("form.createDescription")}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t("common:actions.cancel")}
          </Button>
          <Button type="submit" form="data-gap-form" icon="add" loading={submitting}>
            {t("form.create")}
          </Button>
        </>
      }
    >
      <form id="data-gap-form" noValidate onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label={t("form.category")} error={show("category")} required>
          {(props) => (
            <Select
              {...props}
              value={values.category}
              onChange={set("category")}
              options={GAP_CATEGORIES.map((code) => ({
                value: code,
                label: t(`categories.${code}`),
              }))}
            />
          )}
        </Field>
        <Field label={t("form.entity")} error={show("affected_entity")} required>
          {(props) => (
            <Select
              {...props}
              value={values.affected_entity}
              onChange={set("affected_entity")}
              options={GAP_ENTITIES.map((code) => ({ value: code, label: t(`entities.${code}`) }))}
            />
          )}
        </Field>
        <Field
          label={t("form.description")}
          hint={t("form.descriptionHint")}
          error={show("description")}
          required
          className="sm:col-span-2"
        >
          {(props) => (
            <Textarea
              {...props}
              rows={3}
              value={values.description}
              onChange={set("description")}
            />
          )}
        </Field>
        <Field label={t("form.severity")} error={show("severity")}>
          {(props) => (
            <Select
              {...props}
              value={values.severity}
              onChange={set("severity")}
              options={GAP_SEVERITIES.map((code) => ({
                value: code,
                label: t(`severity.${code}`),
              }))}
            />
          )}
        </Field>
        <Field
          label={t("form.sourceReference")}
          hint={t("form.sourceReferenceHint")}
          error={show("source_reference")}
        >
          {(props) => (
            <Input {...props} value={values.source_reference} onChange={set("source_reference")} />
          )}
        </Field>
        <fieldset className="flex flex-col gap-2 sm:col-span-2">
          <legend className="mb-1.5 text-label-md font-semibold text-on-surface">
            {t("form.bylawScope")}
          </legend>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {BYLAW_SCOPES.map((code) => (
              <Checkbox
                key={code}
                label={t(`scope.${code}`)}
                checked={values.bylaw_scope.includes(code)}
                onChange={toggleScope(code)}
              />
            ))}
          </div>
          {serverFields.bylaw_scope && <p className="text-body-sm text-error">{error.message}</p>}
        </fieldset>
        <Field
          label={t("form.notes")}
          hint={t("form.notesHint")}
          error={show("notes")}
          className="sm:col-span-2"
        >
          {(props) => <Textarea {...props} rows={2} value={values.notes} onChange={set("notes")} />}
        </Field>
        {error && !hasFieldError && (
          <p role="alert" className="text-body-sm text-error sm:col-span-2">
            {error.message}
          </p>
        )}
      </form>
    </Dialog>
  );
}
