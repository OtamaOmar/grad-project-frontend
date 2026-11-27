import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Button, Dialog } from "@/components/ui";

// Shown once after a staff account is created: the temporary password the server made.
// It is not stored anywhere readable, so closing this dialog is the last chance to copy it.
export function TemporaryPasswordDialog({ user, onClose }) {
  const { t } = useTranslation("adminUsers");
  const [copied, setCopied] = useState(false);

  // Copies the password to the clipboard and shows "Copied" on the button.
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(user.temporary_password);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  return (
    <Dialog
      open={Boolean(user)}
      onClose={onClose}
      title={t("tempPassword.title", { name: user?.full_name })}
      description={t("tempPassword.body", { username: user?.username })}
      footer={
        <>
          <Button variant="secondary" onClick={copy}>
            {copied ? t("tempPassword.copied") : t("tempPassword.copy")}
          </Button>
          <Button onClick={onClose}>{t("tempPassword.done")}</Button>
        </>
      }
    >
      <p
        dir="ltr"
        className="select-all rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3 text-center font-mono text-title-md tracking-wider"
      >
        {user?.temporary_password}
      </p>
      <Alert tone="warning" className="mt-4">
        {t("tempPassword.warning")}
      </Alert>
    </Dialog>
  );
}
