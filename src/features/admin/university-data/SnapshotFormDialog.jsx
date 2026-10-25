import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Button, Dialog, Field, Input, Select } from "@/components/ui";
import { useToast } from "@/hooks/useToast";
import { serverFieldError } from "./dataFormat";
import { useCreateSnapshot } from "./useUniversityData";

const KINDS = ["faculty_roster", "registration"];
const FIELDS = ["kind", "version_label", "file_name"];

/**
 * "Initiate snapshot ingestion": records a new snapshot header, which becomes the current
 * version for its kind. Grades and quotas are never edited here.
 */
export function SnapshotFormDialog({
  defaultKind = "faculty_roster",
  dataLock,
  onClose,
  onCreated,
}) {
  const { t } = useTranslation(["adminUniversityData", "common"]);
  const toast = useToast();
  const createSnapshot = useCreateSnapshot();
  const error = createSnapshot.error;
  const [values, setValues] = useState({ kind: defaultKind, version_label: "", file_name: "" });
  const [touched, setTouched] = useState(false);

  const required = t("common:states.required");
  const errors = Object.fromEntries(
    FIELDS.map((field) => [
      field,
      !values[field].trim() ? required : serverFieldError(error, field),
    ]),
  );
  const show = (field) => (touched || error?.details?.fields?.[field] ? errors[field] : null);
  const set = (field) => (event) => setValues((v) => ({ ...v, [field]: event.target.value }));

  const submit = (event) => {
    event.preventDefault();
    setTouched(true);
    if (FIELDS.some((field) => !values[field].trim())) return;
    createSnapshot.mutate(
      {
        kind: values.kind,
        version_label: values.version_label.trim().toUpperCase(),
        file_name: values.file_name.trim(),
      },
      {
        onSuccess: (snapshot) => {
          toast.success(t("toast.snapshotCreated", { label: snapshot.version_label }));
          onCreated?.(snapshot);
          onClose();
        },
      },
    );
  };

  const fieldError = Object.keys(error?.details?.fields ?? {}).some((field) =>
    FIELDS.includes(field),
  );

  return (
    <Dialog
      open
      onClose={onClose}
      title={t("snapshotForm.title")}
      description={t("snapshotForm.description")}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t("common:actions.cancel")}
          </Button>
          <Button
            type="submit"
            form="snapshot-form"
            icon="cloud_sync"
            loading={createSnapshot.isPending}
          >
            {t("snapshotForm.submit")}
          </Button>
        </>
      }
    >
      <form id="snapshot-form" noValidate onSubmit={submit} className="flex flex-col gap-4">
        {dataLock?.locked && (
          <Alert
            tone="warning"
            title={t(`lockState.${dataLock.state}`, { defaultValue: dataLock.state })}
          >
            {t("snapshotForm.lockNote")}
          </Alert>
        )}
        <Field label={t("snapshotForm.kind")} error={show("kind")} required>
          {(props) => (
            <Select
              {...props}
              value={values.kind}
              onChange={set("kind")}
              options={KINDS.map((kind) => ({ value: kind, label: t(`kind.${kind}`) }))}
            />
          )}
        </Field>
        <Field
          label={t("snapshotForm.version")}
          hint={t("snapshotForm.versionHint")}
          error={show("version_label")}
          required
        >
          {(props) => (
            <Input
              {...props}
              dir="ltr"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder={values.kind === "registration" ? "HISTORICAL_REV5" : "AY2027_SPRING"}
              value={values.version_label}
              onChange={set("version_label")}
            />
          )}
        </Field>
        <Field
          label={t("snapshotForm.file")}
          hint={t("snapshotForm.fileHint")}
          error={show("file_name")}
          required
        >
          {(props) => (
            <Input
              {...props}
              dir="ltr"
              spellCheck={false}
              placeholder="SIS_EXPORT.csv"
              value={values.file_name}
              onChange={set("file_name")}
            />
          )}
        </Field>
        {error && !fieldError && <Alert tone="danger">{error.message}</Alert>}
      </form>
    </Dialog>
  );
}
