import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Dialog, Field, Input, Select, Textarea } from "@/components/ui";
import { useToast } from "@/hooks/useToast";
import { hasFieldError, serverFieldError } from "./formErrors";
import { useCreateTrack, useUpdateTrack } from "./usePrograms";

const TRACK_STATUSES = ["active", "planned", "inactive"];
const REQUIRED = ["program_id", "code", "name", "source_reference"];

/**
 * Create (no `track`) or edit a specialization track. A track belongs to one program for
 * life, so the program picker is only shown when creating.
 */
export function TrackFormDialog({ track, programs, defaultProgramId, onClose }) {
  const { t } = useTranslation(["adminPrograms", "common"]);
  const toast = useToast();
  const editing = Boolean(track);
  const createTrack = useCreateTrack();
  const updateTrack = useUpdateTrack();
  const mutation = editing ? updateTrack : createTrack;
  const error = mutation.error;

  const [values, setValues] = useState({
    program_id: String(track?.program_id ?? defaultProgramId ?? programs[0]?.id ?? ""),
    code: track?.code ?? "",
    name: track?.name ?? "",
    description: track?.description ?? "",
    status: track?.status ?? "planned",
    source_reference: track?.source_reference ?? "",
  });
  const [touched, setTouched] = useState(false);

  const required = t("common:states.required");
  const errors = {
    ...Object.fromEntries(
      REQUIRED.map((field) => [
        field,
        !String(values[field]).trim() ? required : serverFieldError(error, field),
      ]),
    ),
    status: serverFieldError(error, "status"),
    description: serverFieldError(error, "description"),
  };
  const show = (field) => (touched || error?.details?.fields?.[field] ? errors[field] : null);
  const set = (field) => (event) => setValues((v) => ({ ...v, [field]: event.target.value }));

  const submit = (event) => {
    event.preventDefault();
    setTouched(true);
    if (REQUIRED.some((field) => !String(values[field]).trim())) return;
    const body = {
      code: values.code.trim().toLowerCase(),
      name: values.name.trim(),
      description: values.description.trim(),
      status: values.status,
      source_reference: values.source_reference.trim(),
    };
    const onSuccess = (saved) => {
      toast.success(t(editing ? "toast.trackUpdated" : "toast.trackCreated", saved));
      onClose();
    };
    if (editing) updateTrack.mutate({ id: track.id, ...body }, { onSuccess });
    else createTrack.mutate({ programId: Number(values.program_id), ...body }, { onSuccess });
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={editing ? t("trackForm.editTitle") : t("trackForm.createTitle")}
      description={
        editing ? `${track.program_name} · ${track.name}` : t("trackForm.createDescription")
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t("common:actions.cancel")}
          </Button>
          <Button type="submit" form="track-form" loading={mutation.isPending}>
            {editing ? t("form.save") : t("trackForm.create")}
          </Button>
        </>
      }
    >
      <form id="track-form" noValidate onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        {!editing && (
          <Field
            label={t("trackForm.program")}
            error={show("program_id")}
            required
            className="sm:col-span-2"
          >
            {(props) => (
              <Select
                {...props}
                value={values.program_id}
                onChange={set("program_id")}
                options={programs.map((program) => ({
                  value: String(program.id),
                  label: `${program.name} (${program.code}) · ${t(
                    `bylaw.long.${program.bylaw_code}`,
                    { defaultValue: program.bylaw_code },
                  )}`,
                }))}
              />
            )}
          </Field>
        )}
        <Field label={t("trackForm.name")} error={show("name")} required>
          {(props) => <Input {...props} value={values.name} onChange={set("name")} />}
        </Field>
        <Field
          label={t("trackForm.code")}
          hint={t("trackForm.codeHint")}
          error={show("code")}
          required
        >
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
        <Field
          label={t("trackForm.description")}
          hint={t("trackForm.descriptionHint")}
          error={show("description")}
          className="sm:col-span-2"
        >
          {(props) => (
            <Textarea
              {...props}
              rows={2}
              value={values.description}
              onChange={set("description")}
            />
          )}
        </Field>
        <Field label={t("trackForm.status")} error={show("status")}>
          {(props) => (
            <Select
              {...props}
              value={values.status}
              onChange={set("status")}
              options={TRACK_STATUSES.map((status) => ({
                value: status,
                label: t(`trackStatus.${status}`),
              }))}
            />
          )}
        </Field>
        <Field
          label={t("form.sourceReference")}
          hint={t("form.sourceReferenceHint")}
          error={show("source_reference")}
          required
        >
          {(props) => (
            <Input {...props} value={values.source_reference} onChange={set("source_reference")} />
          )}
        </Field>
        {error && !hasFieldError(error, [...REQUIRED, "status", "description"]) && (
          <p role="alert" className="text-body-sm text-error sm:col-span-2">
            {error.message}
          </p>
        )}
      </form>
    </Dialog>
  );
}
