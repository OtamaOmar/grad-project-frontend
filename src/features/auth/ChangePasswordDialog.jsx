import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Button, Dialog, Field, Input } from "@/components/ui";
import { useToast } from "@/hooks/useToast";
import { authApi } from "@/services/api/auth";

const EMPTY = { current: "", next: "", confirm: "" };

// Change password: the current password, a new one (8+ characters, different) typed twice.
// On success the server ends every other session and keeps this one signed in.
export function ChangePasswordDialog({ open, onClose }) {
  const { t } = useTranslation("profile");
  const toast = useToast();
  const [values, setValues] = useState(EMPTY);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState(null);

  // Updates one field and clears the server error, which no longer applies.
  const set = (key) => (event) => {
    setValues((current) => ({ ...current, [key]: event.target.value }));
    setServerError(null);
  };

  // Clears the form and closes the dialog.
  const close = () => {
    setValues(EMPTY);
    setTouched(false);
    setServerError(null);
    onClose();
  };

  const errors = {
    current: values.current ? null : t("password.required"),
    next:
      values.next.length < 8
        ? t("password.tooShort")
        : values.next === values.current
          ? t("password.sameAsCurrent")
          : null,
    confirm: values.confirm === values.next ? null : t("password.mismatch"),
  };
  const wrongCurrent = serverError?.details?.fields?.current_password === "incorrect";

  // Sends the change; a wrong current password is shown under that field.
  const submit = async (event) => {
    event.preventDefault();
    setTouched(true);
    if (Object.values(errors).some(Boolean)) return;
    setSaving(true);
    try {
      await authApi.changePassword({
        current_password: values.current,
        new_password: values.next,
      });
      toast.success(t("password.changed"));
      close();
    } catch (error) {
      setServerError(error);
    } finally {
      setSaving(false);
    }
  };

  const show = (key) => (touched ? errors[key] : null);

  return (
    <Dialog
      open={open}
      onClose={close}
      title={t("password.title")}
      description={t("password.description")}
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            {t("actions.cancel")}
          </Button>
          <Button type="submit" form="change-password-form" loading={saving}>
            {t("password.submit")}
          </Button>
        </>
      }
    >
      <form id="change-password-form" noValidate onSubmit={submit} className="flex flex-col gap-4">
        {serverError && !wrongCurrent && <Alert tone="danger">{serverError.message}</Alert>}
        <Field
          label={t("password.current")}
          error={wrongCurrent ? t("password.incorrect") : show("current")}
        >
          {(props) => (
            <Input
              {...props}
              type="password"
              autoComplete="current-password"
              value={values.current}
              onChange={set("current")}
            />
          )}
        </Field>
        <Field label={t("password.new")} hint={t("password.newHint")} error={show("next")}>
          {(props) => (
            <Input
              {...props}
              type="password"
              autoComplete="new-password"
              value={values.next}
              onChange={set("next")}
            />
          )}
        </Field>
        <Field label={t("password.confirm")} error={show("confirm")}>
          {(props) => (
            <Input
              {...props}
              type="password"
              autoComplete="new-password"
              value={values.confirm}
              onChange={set("confirm")}
            />
          )}
        </Field>
      </form>
    </Dialog>
  );
}
