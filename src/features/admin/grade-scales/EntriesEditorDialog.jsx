import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Button, Checkbox, Dialog, IconButton } from "@/components/ui";
import { bylawName } from "@/features/admin/credit-limits/constants";
import { cn } from "@/utils/cn";
import { formatNumber } from "@/utils/format";

const CELL_INPUT =
  "h-9 w-full rounded-md border border-outline-variant bg-surface-container-lowest px-2 text-body-md text-on-surface " +
  "transition-colors hover:border-outline focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none " +
  "aria-[invalid=true]:border-error";

const toText = (value) => (value === null || value === undefined ? "" : String(Number(value)));
const toNumber = (value) => (String(value).trim() === "" ? null : Number(value));

let draftId = 0;
const toDraft = (entry) => ({
  key: `draft-${++draftId}`,
  letter: entry?.letter ?? "",
  grade_points: toText(entry?.grade_points),
  min_percentage: toText(entry?.min_percentage),
  max_percentage: toText(entry?.max_percentage),
  min_inclusive: entry?.min_inclusive ?? true,
  max_inclusive: entry?.max_inclusive ?? false,
  source_reference: entry?.source_reference ?? "",
});

/**
 * Edits every letter of one scale (the API replaces the whole set). Per-row server errors
 * come from error.details.entries[index]; overlapping bands from details.overlaps.
 */
export function EntriesEditorDialog({ scale, onClose, onSubmit, submitting, error }) {
  const { t } = useTranslation(["adminGradeScales", "adminCreditLimits", "common"]);
  const [rows, setRows] = useState(() => scale.entries.map(toDraft));
  const [verified, setVerified] = useState(false);

  const rowErrors = error?.details?.entries ?? {};
  const overlaps = error?.details?.overlaps ?? [];
  const otherError = error && !error.details?.entries && !overlaps.length ? error.message : null;

  const update = (index, field, value) =>
    setRows((current) => current.map((row, i) => (i === index ? { ...row, [field]: value } : row)));

  const submit = (event) => {
    event.preventDefault();
    onSubmit({
      entries: rows.map((row) => ({
        letter: row.letter.trim(),
        grade_points: toNumber(row.grade_points),
        min_percentage: toNumber(row.min_percentage),
        max_percentage: toNumber(row.max_percentage),
        min_inclusive: row.min_inclusive,
        max_inclusive: row.max_inclusive,
        source_reference: row.source_reference.trim(),
      })),
      verifiedAgainstPdf: verified,
    });
  };

  const fieldError = (index, field) => {
    const code = rowErrors[index]?.[field];
    return code ? t(`fieldErrors.${code}`, { defaultValue: code }) : null;
  };

  const headers = [
    ["letter", "w-20"],
    ["grade_points", "w-24"],
    ["min_percentage", "w-24"],
    ["max_percentage", "w-24"],
    ["source_reference", ""],
  ];

  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      title={t("editor.title", { name: bylawName(t, scale.bylaw_code) })}
      description={t("editor.description")}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t("common:actions.cancel")}
          </Button>
          <Button type="submit" form="grade-entries-form" loading={submitting}>
            {t("editor.save")}
          </Button>
        </>
      }
    >
      <form id="grade-entries-form" noValidate onSubmit={submit} className="flex flex-col gap-4">
        {overlaps.length > 0 && (
          <Alert tone="danger" title={t("editor.overlapTitle")}>
            {overlaps.map(([lower, upper]) => `${lower} / ${upper}`).join(" · ")}
          </Alert>
        )}
        {otherError && (
          <Alert tone="danger" title={t("editor.errorTitle")}>
            {otherError}
          </Alert>
        )}

        <div className="-mx-6 overflow-x-auto px-6">
          <table className="w-full min-w-[680px] border-collapse text-body-md">
            <caption className="sr-only">{t("editor.title", { name: scale.bylaw_code })}</caption>
            <thead>
              <tr className="text-label-sm tracking-wider text-on-surface-variant uppercase">
                {headers.map(([field, width]) => (
                  <th key={field} scope="col" className={cn("pb-2 pe-2 text-start", width)}>
                    {t(`editor.fields.${field}`)}
                  </th>
                ))}
                <th scope="col" className="w-10 pb-2">
                  <span className="sr-only">{t("editor.remove")}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => {
                const errors = Object.keys(rowErrors[index] ?? {});
                const errorId = `entry-${row.key}-error`;
                const input = (field, props = {}) => (
                  <input
                    className={CELL_INPUT}
                    aria-label={t("editor.cellLabel", {
                      field: t(`editor.fields.${field}`),
                      row: formatNumber(index + 1),
                    })}
                    aria-invalid={fieldError(index, field) ? true : undefined}
                    aria-describedby={errors.length ? errorId : undefined}
                    value={row[field]}
                    onChange={(event) => update(index, field, event.target.value)}
                    {...props}
                  />
                );
                return (
                  <tr
                    key={row.key}
                    className={cn(
                      "align-top",
                      errors.length && "bg-error-container/30",
                      "border-t border-outline-variant/60",
                    )}
                  >
                    <td className="py-2 pe-2">
                      {input("letter", {
                        dir: "ltr",
                        maxLength: 4,
                        className: `${CELL_INPUT} font-mono`,
                      })}
                    </td>
                    <td className="py-2 pe-2">
                      {input("grade_points", { type: "number", step: "0.01", min: 0, max: 4 })}
                    </td>
                    <td className="py-2 pe-2">
                      {input("min_percentage", { type: "number", step: "0.01", min: 0, max: 100 })}
                      <Checkbox
                        className="mt-1 text-label-sm"
                        label={t("editor.included")}
                        checked={row.min_inclusive}
                        onChange={(event) => update(index, "min_inclusive", event.target.checked)}
                      />
                    </td>
                    <td className="py-2 pe-2">
                      {input("max_percentage", { type: "number", step: "0.01", min: 0, max: 100 })}
                      <Checkbox
                        className="mt-1 text-label-sm"
                        label={t("editor.included")}
                        checked={row.max_inclusive}
                        onChange={(event) => update(index, "max_inclusive", event.target.checked)}
                      />
                    </td>
                    <td className="py-2 pe-2">
                      {input("source_reference")}
                      {errors.length > 0 && (
                        <ul id={errorId} className="mt-1 flex flex-col gap-0.5">
                          {errors.map((field) => (
                            <li key={field} className="text-body-sm text-error">
                              {t(`editor.fields.${field}`)}: {fieldError(index, field)}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                    <td className="py-2">
                      <IconButton
                        icon="delete"
                        size="sm"
                        label={t("editor.removeRow", {
                          letter: row.letter || formatNumber(index + 1),
                        })}
                        disabled={rows.length === 1}
                        onClick={() => setRows((current) => current.filter((_, i) => i !== index))}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            variant="secondary"
            size="sm"
            icon="add"
            onClick={() =>
              setRows((current) => [
                ...current,
                toDraft({ source_reference: scale.source_reference }),
              ])
            }
          >
            {t("editor.addLetter")}
          </Button>
          <p className="text-body-sm text-on-surface-variant">{t("editor.bandRule")}</p>
        </div>

        <Alert tone={verified ? "success" : "warning"}>
          <Checkbox
            label={t("editor.verified")}
            checked={verified}
            onChange={(event) => setVerified(event.target.checked)}
          />
          <p className="mt-1">{t("editor.verifiedHint")}</p>
        </Alert>
      </form>
    </Dialog>
  );
}
