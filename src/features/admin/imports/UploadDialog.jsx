import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Dialog, Field, Icon, Select, Textarea } from "@/components/ui";
import { IMPORT_KINDS, CATALOG_KINDS, formatBytes, termLabel } from "./importFormat";
import { useUploadOptions } from "./useImports";

/**
 * Upload a .csv / .xlsx file for validation. The mock API takes the file's metadata as JSON
 * (name and size are read from the chosen file); the real endpoint will be multipart.
 * Server field errors (error.details.fields) show under the matching control.
 */
export function UploadDialog({ open, onClose, onSubmit, submitting, error }) {
  const { t } = useTranslation(["adminImports", "common"]);
  const options = useUploadOptions(open);
  const [values, setValues] = useState({
    kind: "registration_export",
    bylaw_id: "",
    academic_term_id: "",
    notes: "",
  });
  const [file, setFile] = useState(null);
  const [touched, setTouched] = useState(false);

  const serverFields = error?.details?.fields ?? {};
  const required = t("common:states.required");
  const needsTerm = values.kind === "registration_export";
  const usesBylaw = CATALOG_KINDS.includes(values.kind);

  const localErrors = {
    file_name: !file
      ? required
      : !/\.(csv|xlsx)$/i.test(file.name)
        ? t("upload.unsupported")
        : null,
    academic_term_id: needsTerm && !values.academic_term_id ? t("upload.termRequired") : null,
  };
  const serverError = (field) =>
    serverFields[field] === "required" ? required : serverFields[field] ? error.message : null;
  const show = (field) => (touched ? localErrors[field] : null) ?? serverError(field);

  const set = (field) => (event) => setValues((v) => ({ ...v, [field]: event.target.value }));

  const submit = (event) => {
    event.preventDefault();
    setTouched(true);
    if (localErrors.file_name || localErrors.academic_term_id) return;
    onSubmit({
      kind: values.kind,
      file_name: file.name,
      file_size_bytes: file.size,
      bylaw_id: usesBylaw && values.bylaw_id ? Number(values.bylaw_id) : undefined,
      academic_term_id: needsTerm ? Number(values.academic_term_id) : undefined,
      notes: values.notes.trim() || undefined,
    });
  };

  const bylaws = options.data?.bylaws ?? [];
  const terms = options.data?.terms ?? [];
  const hasFieldError = Object.keys(serverFields).length > 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t("upload.title")}
      description={t("upload.description")}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t("common:actions.cancel")}
          </Button>
          <Button type="submit" form="import-upload-form" icon="upload" loading={submitting}>
            {t("upload.submit")}
          </Button>
        </>
      }
    >
      <form
        id="import-upload-form"
        noValidate
        onSubmit={submit}
        className="grid gap-4 sm:grid-cols-2"
      >
        <Field label={t("upload.kind")} error={show("kind")} required className="sm:col-span-2">
          {(props) => (
            <Select
              {...props}
              value={values.kind}
              onChange={set("kind")}
              options={IMPORT_KINDS.map((kind) => ({ value: kind, label: t(`kinds.${kind}`) }))}
            />
          )}
        </Field>

        <Field
          label={t("upload.file")}
          hint={file ? null : t("upload.fileHint")}
          error={show("file_name")}
          required
          className="sm:col-span-2"
        >
          {(props) => (
            <label
              className={
                "flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-outline-variant bg-surface-container-low px-4 py-6 text-center transition-colors hover:border-primary focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20"
              }
            >
              <Icon name="upload_file" size={28} className="text-primary" />
              {file ? (
                <span className="min-w-0">
                  <span dir="ltr" className="block truncate font-semibold text-on-surface">
                    {file.name}
                  </span>
                  <span className="text-body-sm text-on-surface-variant">
                    {formatBytes(file.size, t)}
                  </span>
                </span>
              ) : (
                <span className="text-body-md text-on-surface-variant">{t("upload.choose")}</span>
              )}
              <input
                {...props}
                type="file"
                accept=".csv,.xlsx"
                className="sr-only"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            </label>
          )}
        </Field>

        {usesBylaw && (
          <Field label={t("upload.bylaw")} hint={t("upload.bylawHint")} error={show("bylaw_id")}>
            {(props) => (
              <Select
                {...props}
                value={values.bylaw_id}
                onChange={set("bylaw_id")}
                disabled={options.isPending}
                options={[
                  { value: "", label: t("upload.noBylaw") },
                  ...bylaws.map((bylaw) => ({
                    value: String(bylaw.id),
                    label: t(`bylaw.${bylaw.code}`, { defaultValue: bylaw.name }),
                  })),
                ]}
              />
            )}
          </Field>
        )}

        {needsTerm && (
          <Field
            label={t("upload.term")}
            hint={t("upload.termHint")}
            error={show("academic_term_id")}
            required
          >
            {(props) => (
              <Select
                {...props}
                value={values.academic_term_id}
                onChange={set("academic_term_id")}
                disabled={options.isPending}
                options={[
                  { value: "", label: t("upload.chooseTerm") },
                  ...terms.map((term) => ({ value: String(term.id), label: termLabel(term, t) })),
                ]}
              />
            )}
          </Field>
        )}

        <Field label={t("upload.notes")} className="sm:col-span-2">
          {(props) => <Textarea {...props} rows={2} value={values.notes} onChange={set("notes")} />}
        </Field>

        {options.isError && (
          <p role="alert" className="text-body-sm text-error sm:col-span-2">
            {t("upload.optionsError")}
          </p>
        )}
        {error && !hasFieldError && (
          <p role="alert" className="text-body-sm text-error sm:col-span-2">
            {error.message}
          </p>
        )}
      </form>
    </Dialog>
  );
}
