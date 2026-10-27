import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Dialog, Field, Input, Select } from "@/components/ui";
import { ROLES } from "@/config/roles";

const STAFF_ROLES = [ROLES.ADMIN, ROLES.COORDINATOR, ROLES.ADVISOR];

/**
 * Create (no `user`) or edit (`user`) a staff account. Server field errors
 * (error.details.fields) are shown under the matching input.
 * Mount it with a `key` per user so the form resets between users.
 */
export function UserFormDialog({ open, user, onClose, onSubmit, submitting, error }) {
  const { t } = useTranslation(["adminUsers", "common"]);
  const editing = Boolean(user);
  const [values, setValues] = useState({
    full_name: user?.full_name ?? "",
    username: user?.username ?? "",
    role: user?.role ?? ROLES.COORDINATOR,
    staff_code: user?.display_id ?? "",
  });
  const [touched, setTouched] = useState(false);

  const serverFields = error?.details?.fields ?? {};
  const required = t("common:states.required");
  const errors = {
    full_name: !values.full_name.trim() ? required : null,
    username:
      !editing && !values.username.trim() ? required : serverFields.username ? error.message : null,
  };
  const show = (field) => (touched || serverFields[field] ? errors[field] : null);

  const set = (field) => (event) => setValues((v) => ({ ...v, [field]: event.target.value }));

  const submit = (event) => {
    event.preventDefault();
    setTouched(true);
    if (errors.full_name || (!editing && !values.username.trim())) return;
    onSubmit(
      editing
        ? {
            full_name: values.full_name.trim(),
            staff_code: values.staff_code.trim(),
            role: values.role,
          }
        : { ...values, username: values.username.trim().toLowerCase() },
    );
  };

  const isStudent = user?.role === ROLES.STUDENT;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={editing ? t("form.editTitle") : t("form.createTitle")}
      description={editing ? null : t("form.createDescription")}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t("common:actions.cancel")}
          </Button>
          <Button type="submit" form="user-form" loading={submitting}>
            {editing ? t("form.save") : t("form.create")}
          </Button>
        </>
      }
    >
      <form id="user-form" noValidate onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field
          label={t("form.fullName")}
          error={show("full_name")}
          required
          className="sm:col-span-2"
        >
          {(props) => <Input {...props} value={values.full_name} onChange={set("full_name")} />}
        </Field>
        <Field
          label={t("form.username")}
          hint={editing ? null : t("form.usernameHint")}
          error={show("username")}
          required={!editing}
        >
          {(props) => (
            <Input
              {...props}
              dir="ltr"
              autoCapitalize="none"
              spellCheck={false}
              disabled={editing}
              value={values.username}
              onChange={set("username")}
            />
          )}
        </Field>
        <Field label={t("form.role")}>
          {(props) => (
            <Select
              {...props}
              disabled={isStudent}
              value={values.role}
              onChange={set("role")}
              options={(isStudent ? [ROLES.STUDENT] : STAFF_ROLES).map((role) => ({
                value: role,
                label: t(`common:roles.${role}`),
              }))}
            />
          )}
        </Field>
        {!isStudent && (
          <Field
            label={t("form.staffCode")}
            hint={t("form.staffCodeHint")}
            className="sm:col-span-2"
          >
            {(props) => (
              <Input {...props} dir="ltr" value={values.staff_code} onChange={set("staff_code")} />
            )}
          </Field>
        )}
        {error && !serverFields.username && (
          <p role="alert" className="text-body-sm text-error sm:col-span-2">
            {error.message}
          </p>
        )}
      </form>
    </Dialog>
  );
}
