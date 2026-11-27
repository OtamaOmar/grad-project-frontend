import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import {
  Badge,
  Button,
  Drawer,
  EmptyState,
  ErrorState,
  Field,
  Input,
  Select,
  Skeleton,
  Textarea,
} from "@/components/ui";
import { useToast } from "@/hooks/useToast";
import { PATHS } from "@/routes/paths";
import { formatDate, formatNumber } from "@/utils/format";
import { GAP_SEVERITIES, SEVERITY_TONE, STATUS_TONE } from "./constants";
import { useDataGap, useUpdateDataGap } from "./useDataGaps";

const ISSUE_TONE = { error: "danger", warning: "warning", info: "info" };

/** Gap detail: description, linked load-report rows, and the decision form (update / resolve). */
export function DataGapDrawer({ gapId, onClose }) {
  const { t } = useTranslation(["adminDataGaps", "common"]);
  const gap = useDataGap(gapId);

  return (
    <Drawer
      open={gapId != null}
      onClose={onClose}
      width="36rem"
      title={gap.data?.gap_code ?? t("detail.title")}
    >
      {gap.isPending && (
        <div className="flex flex-col gap-4 p-5">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      )}
      {gap.isError && <ErrorState error={gap.error} onRetry={gap.refetch} />}
      {gap.data && <GapDetail key={gap.data.id} gap={gap.data} onClose={onClose} />}
    </Drawer>
  );
}

function GapDetail({ gap, onClose }) {
  const { t } = useTranslation(["adminDataGaps", "common"]);
  const toast = useToast();
  const update = useUpdateDataGap();
  const [values, setValues] = useState({
    severity: gap.severity ?? "",
    source_reference: gap.source_reference ?? "",
    notes: gap.notes ?? "",
  });
  const [resolveTried, setResolveTried] = useState(false);
  const set = (field) => (event) => setValues((v) => ({ ...v, [field]: event.target.value }));

  const serverFields = update.error?.details?.fields ?? {};
  const notesMissing = !values.notes.trim();
  const notesError =
    (resolveTried && notesMissing) || serverFields.notes ? t("detail.notesRequired") : null;

  const save = (extra = {}, successKey = "toast.updated") =>
    update.mutate(
      {
        id: gap.id,
        severity: values.severity || undefined,
        source_reference: values.source_reference.trim() || null,
        notes: values.notes.trim() || null,
        ...extra,
      },
      {
        onSuccess: (row) => {
          toast.success(t(successKey, { code: row.gap_code }));
          if (extra.status === "resolved") onClose();
        },
        onError: (error) => toast.error(error.message),
      },
    );

  const resolve = () => {
    setResolveTried(true);
    if (notesMissing) return;
    save({ status: "resolved" }, "toast.resolved");
  };

  const isOpen = gap.status === "open";
  const pending = update.isPending ? (update.variables?.status ?? "save") : null;

  return (
    <div className="flex flex-col gap-6 p-5">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={STATUS_TONE[gap.status]} dot>
            {t(`status.${gap.status}`)}
          </Badge>
          {gap.severity ? (
            <Badge tone={SEVERITY_TONE[gap.severity]}>{t(`severity.${gap.severity}`)}</Badge>
          ) : (
            <span className="text-on-surface-variant">—</span>
          )}
          {gap.bylaw_scope.map((code) => (
            <Badge key={code} tone="outline">
              {t(`scope.${code}`)}
            </Badge>
          ))}
        </div>
        <div>
          <p className="text-label-md font-semibold text-primary">
            {t(`categories.${gap.category}`, { defaultValue: gap.category })}
          </p>
          <p className="mt-1 text-body-lg text-on-surface">{gap.description}</p>
        </div>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg bg-surface-container-low p-4 text-body-sm">
          <div>
            <dt className="text-on-surface-variant">{t("detail.entity")}</dt>
            <dd className="mt-0.5 font-medium text-on-surface">
              {t(`entities.${gap.affected_entity}`, { defaultValue: gap.affected_entity })}
            </dd>
          </div>
          <div>
            <dt className="text-on-surface-variant">{t("detail.source")}</dt>
            <dd className="mt-0.5 font-medium text-on-surface">{gap.source_reference ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-on-surface-variant">{t("detail.created")}</dt>
            <dd className="mt-0.5 font-medium text-on-surface">{formatDate(gap.created_at)}</dd>
          </div>
          <div>
            <dt className="text-on-surface-variant">{t("detail.updated")}</dt>
            <dd className="mt-0.5 font-medium text-on-surface">
              {formatDate(gap.updated_at, "datetime")}
            </dd>
          </div>
        </dl>
      </div>

      <section aria-labelledby="gap-issues-title">
        <div className="flex items-center justify-between gap-2">
          <h3
            id="gap-issues-title"
            className="text-label-sm font-semibold tracking-wider text-on-surface-variant uppercase"
          >
            {t("detail.linkedIssues")}
          </h3>
          <Badge tone="neutral">{formatNumber(gap.import_issues.length)}</Badge>
        </div>
        {gap.import_issues.length === 0 ? (
          <EmptyState
            icon="link_off"
            title={t("detail.noIssuesTitle")}
            description={t("detail.noIssuesBody")}
            className="py-6"
          />
        ) : (
          <ul className="mt-3 divide-y divide-outline-variant/60 rounded-lg border border-outline-variant/70">
            {gap.import_issues.map((issue) => (
              <li key={issue.id} className="flex flex-col gap-1 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone={ISSUE_TONE[issue.severity]}>
                    {t(`issueSeverity.${issue.severity}`)}
                  </Badge>
                  <span dir="ltr" className="font-mono text-label-md text-on-surface">
                    {issue.code}
                  </span>
                  <Link
                    to={`${PATHS.admin.imports}?batch=${issue.import_batch_id}`}
                    className="ms-auto text-label-md font-semibold text-primary hover:underline"
                  >
                    {t("detail.issueRow", { row: formatNumber(issue.row_number) })}
                  </Link>
                </div>
                <p className="text-body-sm text-on-surface">{issue.message}</p>
                <p
                  dir="ltr"
                  className="font-mono text-body-sm text-on-surface-variant rtl:text-end"
                >
                  {issue.record_key}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section
        aria-labelledby="gap-decision-title"
        className="flex flex-col gap-4 border-t border-outline-variant/70 pt-5"
      >
        <h3 id="gap-decision-title" className="font-serif text-headline-sm font-semibold">
          {t("detail.decisionTitle")}
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("form.severity")}>
            {(props) => (
              <Select
                {...props}
                value={values.severity}
                onChange={set("severity")}
                // "—" while the gap has no severity, so the box does not pretend it is High.
                options={[
                  ...(values.severity ? [] : [{ value: "", label: "—" }]),
                  ...GAP_SEVERITIES.map((code) => ({
                    value: code,
                    label: t(`severity.${code}`),
                  })),
                ]}
              />
            )}
          </Field>
          <Field label={t("form.sourceReference")}>
            {(props) => (
              <Input
                {...props}
                value={values.source_reference}
                onChange={set("source_reference")}
              />
            )}
          </Field>
          <Field
            label={t("detail.notes")}
            hint={isOpen ? t("detail.notesHint") : null}
            error={notesError}
            className="sm:col-span-2"
          >
            {(props) => (
              <Textarea {...props} rows={4} value={values.notes} onChange={set("notes")} />
            )}
          </Field>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            variant="secondary"
            onClick={() => save()}
            loading={pending === "save"}
            disabled={Boolean(pending)}
          >
            {t("detail.save")}
          </Button>
          {isOpen ? (
            <Button
              icon="task_alt"
              onClick={resolve}
              loading={pending === "resolved"}
              disabled={Boolean(pending)}
            >
              {t("detail.resolve")}
            </Button>
          ) : (
            <Button
              variant="tonal"
              icon="undo"
              onClick={() => save({ status: "open" }, "toast.reopened")}
              loading={pending === "open"}
              disabled={Boolean(pending)}
            >
              {t("detail.reopen")}
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}
