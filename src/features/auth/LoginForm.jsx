import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Alert, Button, Field, Input } from "@/components/ui";
import { env } from "@/config/env";
import { useAuth } from "@/hooks/useAuth";
import { PATHS } from "@/routes/paths";
import { postLoginPath } from "./redirect";

const DEMO_USERNAMES = ["admin", "coordinator", "student", "advisor"];

/**
 * Username + password sign-in (POST /auth/login). On success goes to ?redirect= when it is
 * an in-app path, otherwise to the user's role home. Hamza's login page can reuse this as is.
 */
export function LoginForm() {
  const { t } = useTranslation(["auth", "common"]);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [values, setValues] = useState({ username: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (event) => setValues((v) => ({ ...v, [field]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    const errors = {};
    if (!values.username.trim()) errors.username = t("required");
    if (!values.password) errors.password = t("required");
    setFieldErrors(errors);
    setFormError(null);
    if (Object.keys(errors).length) return;

    setSubmitting(true);
    try {
      const user = await signIn({ username: values.username.trim(), password: values.password });
      navigate(postLoginPath(searchParams, user.role), { replace: true });
    } catch (error) {
      setFormError(error.status === 401 ? t("invalidCredentials") : error.message);
      setSubmitting(false);
    }
  };

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-5">
      {formError && <Alert tone="danger">{formError}</Alert>}

      <Field label={t("username")} error={fieldErrors.username} required>
        {(props) => (
          <Input
            {...props}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            value={values.username}
            onChange={update("username")}
          />
        )}
      </Field>

      <Field label={t("password")} error={fieldErrors.password} required>
        {(props) => (
          <div className="relative">
            <Input
              {...props}
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              className="pe-11"
              value={values.password}
              onChange={update("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? t("hidePassword") : t("showPassword")}
              className="absolute end-1 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-on-surface-variant hover:bg-surface-container-high"
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                {showPassword ? "visibility_off" : "visibility"}
              </span>
            </button>
          </div>
        )}
      </Field>

      <Link
        to={PATHS.forgotPassword}
        className="-mt-2 self-end text-label-md font-semibold text-primary hover:underline"
      >
        {t("forgotPassword")}
      </Link>

      <Button type="submit" loading={submitting} className="w-full">
        {t("submit")}
      </Button>

      {env.useMocks && (
        <div className="rounded-lg border border-dashed border-outline-variant p-3">
          <p className="text-label-sm font-semibold tracking-wider text-on-surface-variant uppercase">
            {t("demoAccounts")}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {DEMO_USERNAMES.map((username) => (
              <Button
                key={username}
                variant="secondary"
                size="sm"
                onClick={() => setValues({ username, password: "password" })}
              >
                {t(`common:roles.${username}`)}
              </Button>
            ))}
          </div>
          <p className="mt-2 text-body-sm text-on-surface-variant">{t("demoHint")}</p>
        </div>
      )}
    </form>
  );
}
