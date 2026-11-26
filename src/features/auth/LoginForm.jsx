import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Alert, Button, Dialog, Icon } from "@/components/ui";
import { env } from "@/config/env";
import { useAuth } from "@/hooks/useAuth";
import { PATHS } from "@/routes/paths";
import { postLoginPath } from "./redirect";

const DEMO_USERS = [
  { key: "admin", email: "admin@nu.edu.eg", icon: "admin_panel_settings" },
  { key: "coordinator", email: "coordinator@nu.edu.eg", icon: "hub" },
  { key: "advisor", email: "advisor@nu.edu.eg", icon: "school" },
  { key: "student", email: "student@nu.edu.eg", icon: "person" },
];

export function LoginForm() {
  const { t } = useTranslation(["auth", "common"]);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState(() => {
    try {
      return localStorage.getItem("acops_remember_email") || "";
    } catch {
      return "";
    }
  });
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(() => {
    try {
      return Boolean(localStorage.getItem("acops_remember_email"));
    } catch {
      return false;
    }
  });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [adminDialogOpen, setAdminDialogOpen] = useState(false);

  const validate = () => {
    const errors = {};
    const trimmedEmail = email.trim();
    // A username or an email both work; for an email, the part before "@" is the username.
    if (!trimmedEmail) {
      errors.email = t("required");
    }

    if (!password) {
      errors.password = t("required");
    }

    return errors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    const errors = validate();
    setFieldErrors(errors);
    setFormError(null);
    if (Object.keys(errors).length > 0) return;

    setSubmitting(true);
    try {
      const trimmedEmail = email.trim();
      const username = trimmedEmail.includes("@")
        ? trimmedEmail.split("@")[0].toLowerCase()
        : trimmedEmail.toLowerCase();

      const user = await signIn({
        username,
        email: trimmedEmail,
        password,
      });

      try {
        if (rememberMe) {
          localStorage.setItem("acops_remember_email", trimmedEmail);
        } else {
          localStorage.removeItem("acops_remember_email");
        }
      } catch {
        // Ignore localStorage restrictions
      }

      navigate(postLoginPath(searchParams, user.role), { replace: true });
    } catch (error) {
      setFormError(error.status === 401 ? t("invalidCredentials") : error.message);
      setSubmitting(false);
    }
  };

  const selectDemoAccount = (demoEmail) => {
    setEmail(demoEmail);
    setPassword("password");
    setFieldErrors({});
    setFormError(null);
  };

  return (
    <>
      <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-2.5 sm:gap-3">
        {formError && (
          <Alert tone="danger" className="text-xs sm:text-sm py-1.5 sm:py-2">
            {formError}
          </Alert>
        )}

        {/* Institutional Email Field */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="login-email"
            className="text-[11px] sm:text-xs font-semibold text-[#123B70] dark:text-blue-200 transition-colors"
          >
            {t("usernameOrEmail")}
          </label>
          <div className="relative">
            <span
              className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
              aria-hidden="true"
            >
              <Icon name="mail" size={17} />
            </span>
            <input
              id="login-email"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              placeholder={t("usernameOrEmailPlaceholder")}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) {
                  setFieldErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              aria-invalid={fieldErrors.email ? true : undefined}
              aria-describedby={fieldErrors.email ? "email-error" : undefined}
              className={`h-9.5 sm:h-10 w-full rounded-lg border bg-white dark:bg-slate-800/80 ps-9.5 pe-4 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors focus:border-[#123B70] dark:focus:border-blue-400 focus:ring-2 focus:ring-[#123B70]/15 dark:focus:ring-blue-400/20 focus:outline-none ${
                fieldErrors.email
                  ? "border-red-500 focus:border-red-500 focus:ring-red-100 dark:focus:ring-red-950/40"
                  : "border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600"
              }`}
            />
          </div>
          {fieldErrors.email && (
            <p id="email-error" className="flex items-center gap-1 text-[11px] text-red-600 dark:text-red-400">
              <Icon name="error" size={13} />
              <span>{fieldErrors.email}</span>
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="login-password"
            className="text-[11px] sm:text-xs font-semibold text-[#123B70] dark:text-blue-200 transition-colors"
          >
            {t("password")}
          </label>
          <div className="relative">
            <span
              className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
              aria-hidden="true"
            >
              <Icon name="lock" size={17} />
            </span>
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder={t("passwordPlaceholder")}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) {
                  setFieldErrors((prev) => ({ ...prev, password: undefined }));
                }
              }}
              aria-invalid={fieldErrors.password ? true : undefined}
              aria-describedby={fieldErrors.password ? "password-error" : undefined}
              className={`h-9.5 sm:h-10 w-full rounded-lg border bg-white dark:bg-slate-800/80 ps-9.5 pe-10 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors focus:border-[#123B70] dark:focus:border-blue-400 focus:ring-2 focus:ring-[#123B70]/15 dark:focus:ring-blue-400/20 focus:outline-none ${
                fieldErrors.password
                  ? "border-red-500 focus:border-red-500 focus:ring-red-100 dark:focus:ring-red-950/40"
                  : "border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600"
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? t("hidePassword") : t("showPassword")}
              className="absolute end-1.5 top-1/2 grid size-7.5 -translate-y-1/2 place-items-center rounded-md text-slate-400 dark:text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none cursor-pointer"
            >
              <Icon name={showPassword ? "visibility_off" : "visibility"} size={17} />
            </button>
          </div>
          {fieldErrors.password && (
            <p id="password-error" className="flex items-center gap-1 text-[11px] text-red-600 dark:text-red-400">
              <Icon name="error" size={13} />
              <span>{fieldErrors.password}</span>
            </p>
          )}
        </div>

        {/* Remember me & Forgot Password */}
        <div className="flex items-center justify-between pt-0.5 text-xs">
          <label className="inline-flex cursor-pointer select-none items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="size-3.5 sm:size-4 rounded border-slate-300 dark:border-slate-600 dark:bg-slate-800 text-[#123B70] dark:text-blue-500 accent-[#123B70] focus:ring-[#123B70] dark:focus:ring-blue-500 cursor-pointer"
            />
            <span className="text-[11px] sm:text-xs">{t("rememberMe")}</span>
          </label>
          <Link
            to={PATHS.forgotPassword}
            className="text-[11px] sm:text-xs font-medium text-[#123B70] dark:text-blue-400 hover:text-[#0a2347] dark:hover:text-blue-300 hover:underline transition-colors"
          >
            {t("forgotPassword")}
          </Link>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={submitting}
          className="mt-1 sm:mt-1.5 flex h-9.5 sm:h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#123B70] dark:bg-blue-600 hover:bg-[#0c2a52] dark:hover:bg-blue-500 active:bg-[#09203f] dark:active:bg-blue-700 px-4 text-xs sm:text-sm font-semibold text-white shadow-sm dark:shadow-blue-950/40 transition-all disabled:pointer-events-none disabled:opacity-60 cursor-pointer"
        >
          {submitting ? (
            <span className="flex items-center gap-2">
              <span className="size-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              <span>{t("submit")}...</span>
            </span>
          ) : (
            <>
              <span>{t("submit")}</span>
              <Icon name="arrow_forward" size={16} flipRtl />
            </>
          )}
        </button>

        {/* Contact Administrator / Account Assistance */}
        <p className="mt-1 sm:mt-1.5 text-center text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
          {t("noAccount")}{" "}
          <button
            type="button"
            onClick={() => setAdminDialogOpen(true)}
            className="font-semibold text-[#123B70] dark:text-blue-400 hover:text-[#0a2347] dark:hover:text-blue-300 hover:underline focus:outline-none transition-colors cursor-pointer"
          >
            {t("contactAdmin")}
          </button>
        </p>

        {/* Demo Accounts Box (Mock Mode) - Refined, Modern UI */}
        {env.useMocks && (
          <div className="mt-2 sm:mt-2.5 rounded-xl border border-slate-200/90 dark:border-slate-700/70 bg-slate-50/80 dark:bg-slate-800/50 p-2 sm:p-2.5 text-start transition-colors shadow-2xs">
            <div className="flex items-center justify-between pb-1 sm:pb-1.5 mb-1.5 border-b border-slate-200/80 dark:border-slate-700/60">
              <div className="flex items-center gap-1.5">
                <span className="size-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" aria-hidden="true" />
                <p className="text-[10px] sm:text-[11px] font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
                  {t("demoAccounts")}
                </p>
              </div>
              <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-400">
                <span>pass:</span>
                <code className="font-mono text-[9px] sm:text-[10px] font-semibold px-1 py-0.2 rounded bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300/60 dark:border-slate-600">
                  password
                </code>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-1.5">
              {DEMO_USERS.map(({ key, email: demoEmail, icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => selectDemoAccount(demoEmail)}
                  className="flex items-center justify-center gap-1 rounded-lg border border-slate-200/90 dark:border-slate-600/80 bg-white dark:bg-slate-800 px-1.5 py-1 text-[11px] sm:text-xs font-medium text-slate-700 dark:text-slate-200 shadow-2xs transition-all duration-150 hover:border-[#123B70] dark:hover:border-blue-400 hover:text-[#123B70] dark:hover:text-blue-300 hover:bg-blue-50/50 dark:hover:bg-slate-700/80 active:scale-[0.98] cursor-pointer"
                >
                  <Icon name={icon} size={14} className="text-slate-400 dark:text-slate-400" />
                  <span>{t(`common:roles.${key}`)}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </form>

      {/* Contact Administrator Dialog */}
      <Dialog
        open={adminDialogOpen}
        onClose={() => setAdminDialogOpen(false)}
        title={t("contactModal.title")}
        size="sm"
        footer={
          <div className="flex gap-2">
            <a
              href="mailto:it-support@nu.edu.eg?subject=ACOPS%20Account%20Request"
              className="inline-flex h-9 items-center justify-center rounded-md bg-[#123B70] dark:bg-blue-600 px-4 text-xs font-semibold text-white transition-colors hover:bg-[#0c2a52] dark:hover:bg-blue-500"
            >
              <Icon name="mail" size={16} className="me-1.5" />
              <span>it-support@nu.edu.eg</span>
            </a>
            <Button variant="secondary" size="sm" onClick={() => setAdminDialogOpen(false)}>
              {t("contactModal.close")}
            </Button>
          </div>
        }
      >
        <div className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
          <p>{t("contactModal.desc")}</p>
          <div className="rounded-lg bg-slate-50 dark:bg-slate-800/80 p-3 text-xs space-y-1.5 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 text-slate-800 dark:text-slate-100 font-medium">
              <Icon name="domain" size={16} className="text-[#123B70] dark:text-blue-400" />
              <span>{t("branding.nuCs")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon name="location_on" size={16} className="text-slate-400 dark:text-slate-500" />
              <span>{t("contactModal.office")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon name="email" size={16} className="text-slate-400 dark:text-slate-500" />
              <span>{t("contactModal.email")}</span>
            </div>
          </div>
        </div>
      </Dialog>
    </>
  );
}
