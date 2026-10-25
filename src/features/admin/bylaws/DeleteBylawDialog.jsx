import { useTranslation } from "react-i18next";
import { Alert, Button, Dialog } from "@/components/ui";
import { formatNumber } from "@/utils/format";

/**
 * Delete confirmation. When the server answers 409 BYLAW_IN_USE, the dialog lists what
 * still references the bylaw (error.details.related) and offers to retire it instead.
 */
export function DeleteBylawDialog({
  bylaw,
  onClose,
  onConfirm,
  onRetire,
  deleting,
  retiring,
  error,
}) {
  const { t } = useTranslation(["adminBylaws", "common"]);
  const inUse = error?.code === "BYLAW_IN_USE";
  const related = Object.entries(error?.details?.related ?? {});
  const canRetire = inUse && bylaw?.status !== "retired";

  return (
    <Dialog
      open={Boolean(bylaw)}
      onClose={onClose}
      size="sm"
      title={bylaw ? t("delete.title", { name: bylaw.name }) : ""}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t(inUse ? "common:actions.close" : "common:actions.cancel")}
          </Button>
          {canRetire ? (
            <Button icon="archive" onClick={onRetire} loading={retiring}>
              {t("delete.retireInstead")}
            </Button>
          ) : (
            !inUse && (
              <Button variant="danger" onClick={onConfirm} loading={deleting}>
                {t("delete.confirm")}
              </Button>
            )
          )}
        </>
      }
    >
      {inUse ? (
        <div className="flex flex-col gap-4">
          <Alert tone="warning" title={t("delete.inUseTitle")}>
            {t("delete.inUseBody")}
          </Alert>
          {related.length > 0 && (
            <ul className="grid grid-cols-2 gap-2">
              {related.map(([key, count]) => (
                <li
                  key={key}
                  className="flex items-center justify-between gap-2 rounded-md bg-surface-container-low px-3 py-2 text-body-sm"
                >
                  <span className="text-on-surface-variant">
                    {t(`related.${key}`, { defaultValue: key })}
                  </span>
                  <span className="font-semibold text-on-surface tabular-nums">
                    {formatNumber(count)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-body-md text-on-surface-variant">{t("delete.body")}</p>
          {error && (
            <p role="alert" className="text-body-sm text-error">
              {error.message}
            </p>
          )}
        </div>
      )}
    </Dialog>
  );
}
