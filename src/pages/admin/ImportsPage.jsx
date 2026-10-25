import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router";
import { Button, Card, EmptyState, ErrorState, PageHeader } from "@/components/ui";
import { BatchHistory } from "@/features/admin/imports/BatchHistory";
import { BatchOverview } from "@/features/admin/imports/BatchOverview";
import {
  ChecksCard,
  ReviewQueueCard,
  SourceFeedsCard,
} from "@/features/admin/imports/ImportInfoCards";
import { IssuesPanel } from "@/features/admin/imports/IssuesPanel";
import { UploadDialog } from "@/features/admin/imports/UploadDialog";
import {
  useImportBatch,
  useImportsSummary,
  useUploadImport,
} from "@/features/admin/imports/useImports";
import { useListParams } from "@/hooks/useListParams";
import { useToast } from "@/hooks/useToast";
import { PATHS } from "@/routes/paths";

export default function ImportsPage() {
  const { t } = useTranslation(["adminImports", "common", "pages"]);
  const toast = useToast();
  const listParams = useListParams({ kind: "all", status: "all", sort: "-started_at" });
  // `batch` (the batch on screen) lives in the URL too, but is not a list filter.
  const { batch: batchParam, ...query } = listParams.params;
  const [, setSearchParams] = useSearchParams();

  const summary = useImportsSummary();
  const selectedId = batchParam ? Number(batchParam) : (summary.data?.latest_batch?.id ?? null);
  const batch = useImportBatch(selectedId);
  const upload = useUploadImport();
  const [uploading, setUploading] = useState(false);
  // Severity tab of the load report; resets to "all" when another batch is selected.
  const [severity, setSeverity] = useState({ batchId: null, value: "all" });
  const severityValue = severity.batchId === selectedId ? severity.value : "all";
  const topRef = useRef(null);
  const issuesRef = useRef(null);

  const selectBatch = (id, { scroll = true } = {}) => {
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        next.set("batch", String(id));
        return next;
      },
      { replace: true },
    );
    if (scroll) topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const closeUpload = () => {
    setUploading(false);
    upload.reset();
  };
  const submitUpload = (values) =>
    upload.mutate(values, {
      onSuccess: (created) => {
        toast.success(t("upload.success", { file: created.file_name }));
        closeUpload();
        selectBatch(created.id, { scroll: false });
      },
    });

  const showRejected = () => {
    setSeverity({ batchId: selectedId, value: "error" });
    issuesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const noBatches = summary.data?.total_batches === 0;

  return (
    <div className="flex flex-col gap-6">
      <div ref={topRef} className="scroll-mt-24">
        <PageHeader
          eyebrow={t("eyebrow", { returnObjects: true })}
          title={t("pages:admin.imports")}
          description={t("description")}
          actions={
            <>
              <Button as={Link} to={PATHS.admin.audit} variant="secondary" icon="history">
                {t("auditSnapshots")}
              </Button>
              <Button icon="upload" onClick={() => setUploading(true)}>
                {t("uploadAction")}
              </Button>
            </>
          }
        />
      </div>

      {summary.isError && (
        <Card>
          <ErrorState error={summary.error} onRetry={summary.refetch} />
        </Card>
      )}

      {noBatches ? (
        <Card>
          <EmptyState
            icon="upload_file"
            title={t("empty.title")}
            description={t("empty.body")}
            action={
              <Button icon="upload" onClick={() => setUploading(true)}>
                {t("uploadAction")}
              </Button>
            }
          />
        </Card>
      ) : (
        !summary.isError && (
          <>
            <BatchOverview query={batch} />

            <div ref={issuesRef} className="scroll-mt-24">
              {batch.data && (
                <IssuesPanel
                  key={batch.data.id}
                  batch={batch.data}
                  severity={severityValue}
                  onSeverityChange={(value) => setSeverity({ batchId: selectedId, value })}
                />
              )}
            </div>

            <div className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">
              <ChecksCard batch={batch.data} loading={batch.isPending} />
              <ReviewQueueCard summary={summary} batch={batch.data} onShowRejected={showRejected} />
              <SourceFeedsCard summary={summary} onSelect={(id) => selectBatch(id)} />
            </div>
          </>
        )
      )}

      {!noBatches && (
        <BatchHistory
          listParams={{ ...listParams, query }}
          selectedId={selectedId}
          onSelect={(id) => selectBatch(id)}
        />
      )}

      {uploading && (
        <UploadDialog
          open
          onClose={closeUpload}
          onSubmit={submitUpload}
          submitting={upload.isPending}
          error={upload.error}
        />
      )}
    </div>
  );
}
