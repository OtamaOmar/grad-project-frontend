import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Dialog, Field, Input, Select } from "@/components/ui";
import { useToast } from "@/hooks/useToast";
import { hasFieldError, serverFieldError } from "./formErrors";
import { useCreateProgram, useUpdateProgram } from "./usePrograms";

const FIELDS = ["bylaw_id", "code", "name", "source_reference"];

/** Create (no `program`) or edit a degree program. The bylaw is fixed after creation. */
export function ProgramFormDialog({ program, bylaws, defaultBylawId, onClose }) {
  const { t } = useTranslation(["adminPrograms", "common"]);
  const toast = useToast();
  const editing = Boolean(program);
  const createProgram = useCreateProgram();
  const updateProgram = useUpdateProgram();
  const mutation = editing ? updateProgram : createProgram;
  const error = mutation.error;

  const [values, setValues] = useState({
    bylaw_id: String(program?.bylaw_id ?? defaultBylawId ?? bylaws[0]?.bylaw_id ?? ""),
    code: program?.code ?? "",
    name: program?.name ?? "",
    source_reference: program?.source_reference ?? "",
  });
  const [touched, setTouched] = useState(false);

  const required = t("common:states.required");
  const errors = Object.fromEntries(
    FIELDS.map((field) => [
      field,
      !String(values[field]).trim() ? required : serverFieldError(error, field),
    ]),
  );
  const show = (field) => (touched || error?.details?.fields?.[field] ? errors[field] : null);
  const set = (field) => (event) => setValues((v) => ({ ...v, [field]: event.target.value }));

  const submit = (event) => {
    event.preventDefault();
    setTouched(true);
    if (FIELDS.some((field) => !String(values[field]).trim())) return;
    const body = {
      code: values.code.trim().toUpperCase(),
      name: values.name.trim(),
      source_reference: values.source_reference.trim(),
    };
    const onSuccess = (saved) => {
      toast.success(t(editing ? "toast.programUpdated" : "toast.programCreated", saved));
      onClose();
    };
    if (editing) updateProgram.mutate({ id: program.id, ...body }, { onSuccess });
    else createProgram.mutate({ ...body, bylaw_id: Number(values.bylaw_id) }, { onSuccess });
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={editing ? t("programForm.editTitle") : t("programForm.createTitle")}
      description={editing ? program.name : t("programForm.createDescription")}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t("common:actions.cancel")}
          </Button>
          <Button type="submit" form="program-form" loading={mutation.isPending}>
            {editing ? t("form.save") : t("programForm.create")}
          </Button>
        </>
      }
    >
      <form id="program-form" noValidate onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field
          label={t("form.bylaw")}
          hint={editing ? t("programForm.bylawImmutable") : null}
          error={show("bylaw_id")}
          required
          className="sm:col-span-2"
        >
          {(props) => (
            <Select
              {...props}
              disabled={editing}
              value={values.bylaw_id}
              onChange={set("bylaw_id")}
              options={bylaws.map((bylaw) => ({
                value: String(bylaw.bylaw_id),
                label: t(`bylaw.long.${bylaw.bylaw_code}`, { defaultValue: bylaw.bylaw_code }),
              }))}
            />
          )}
        </Field>
        <Field
          label={t("programForm.code")}
          hint={t("programForm.codeHint")}
          error={show("code")}
          required
        >
          {(props) => (
            <Input
              {...props}
              dir="ltr"
              autoCapitalize="characters"
              spellCheck={false}
              value={values.code}
              onChange={set("code")}
            />
          )}
        </Field>
        <Field label={t("programForm.name")} error={show("name")} required>
          {(props) => <Input {...props} value={values.name} onChange={set("name")} />}
        </Field>
        <Field
          label={t("form.sourceReference")}
          hint={t("form.sourceReferenceHint")}
          error={show("source_reference")}
          required
          className="sm:col-span-2"
        >
          {(props) => (
            <Input {...props} value={values.source_reference} onChange={set("source_reference")} />
          )}
        </Field>
        {error && !hasFieldError(error, FIELDS) && (
          <p role="alert" className="text-body-sm text-error sm:col-span-2">
            {error.message}
          </p>
        )}
      </form>
    </Dialog>
  );
}
