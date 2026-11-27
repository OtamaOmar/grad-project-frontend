import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { Alert, Icon, Skeleton } from "@/components/ui";
import { PATHS } from "@/routes/paths";
import { authApi } from "@/services/api/auth";

export function ForgotPasswordForm() {
  const { t } = useTranslation(["auth", "common"]);
  const [searchParams, setSearchParams] = useSearchParams();
  const urlToken = searchParams.get("token") || "";

  // Step state: "request" | "reset" | "success"
  const [overrideStep, setOverrideStep] = useState(null);
  const [manualToken, setManualToken] = useState("");

  const activeToken = manualToken || urlToken;
  const step = overrideStep ?? (activeToken ? "reset" : "request");

  // Request form state (Step 1)
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState(null);
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestFormError, setRequestFormError] = useState(null);

  // Reset form state (Step 2)
  const [verifyingToken, setVerifyingToken] = useState(() => Boolean(activeToken));
  const [tokenValid, setTokenValid] = useState(() => Boolean(activeToken));
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetFormError, setResetFormError] = useState(null);

  // Verify token asynchronously when activeToken changes in reset step
  useEffect(() => {
    if (step !== "reset" || !activeToken) return;

    let active = true;
    authApi
      .verifyResetToken(activeToken)
      .then(() => {
        if (active) {
          setTokenValid(true);
          setVerifyingToken(false);
        }
      })
      .catch(() => {
        if (active) {
          setTokenValid(false);
          setVerifyingToken(false);
        }
      });

    return () => {
      active = false;
    };
  }, [step, activeToken]);

  // --- Step 1: Submit email request ---
  const handleEmailSubmit = async (event) => {
    event.preventDefault();
    if (requestSubmitting) return;

    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError(t("required"));
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setEmailError(t("emailInvalid"));
      return;
    }

    setEmailError(null);
    setRequestFormError(null);
    setRequestSubmitting(true);

    try {
      const response = await authApi.requestPasswordReset({ email: trimmed });
      const receivedToken = response?.demoToken || "mock-valid-token-12345";
      setManualToken(receivedToken);
      setSearchParams({ token: receivedToken });
      setOverrideStep("reset");
      setTokenValid(true);
      setVerifyingToken(false);
    } catch (err) {
      setRequestFormError(err.message || t("common:errors.generic"));
    } finally {
      setRequestSubmitting(false);
    }
  };

  // --- Step 2: Validate and submit new password ---
  const hasMinLength = newPassword.length >= 8;
  const hasLettersAndNumbers = /[a-zA-Z]/.test(newPassword) && /\d/.test(newPassword);

  const validatePasswords = () => {
    const errors = {};
    if (!newPassword) {
      errors.newPassword = t("required");
    } else if (newPassword.length < 8) {
      errors.newPassword = t("passwordTooShort");
    }

    if (!confirmPassword) {
      errors.confirmPassword = t("required");
    } else if (newPassword && newPassword !== confirmPassword) {
      errors.confirmPassword = t("passwordsDoNotMatch");
    }

    return errors;
  };

  const handleResetSubmit = async (event) => {
    event.preventDefault();
    if (resetSubmitting) return;

    const errors = validatePasswords();
    setPasswordErrors(errors);
    setResetFormError(null);
    if (Object.keys(errors).length > 0) return;

    setResetSubmitting(true);
    try {
      await authApi.resetPassword({ token: activeToken, password: newPassword });
      setOverrideStep("success");
    } catch (err) {
      setResetFormError(err.message || t("common:errors.generic"));
    } finally {
      setResetSubmitting(false);
    }
  };

  const handleRequestNewLink = () => {
    setManualToken("");
    setSearchParams({});
    setNewPassword("");
    setConfirmPassword("");
    setPasswordErrors({});
    setResetFormError(null);
    setOverrideStep("request");
  };

  // ==========================================
  // Render: Step 3 — Success Screen
  // ==========================================
  if (step === "success") {
    return (
      <div className="flex flex-col items-center text-center pt-2">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 shadow-xs mb-4">
          <Icon name="check_circle" size={32} />
        </div>

        <h2 className="text-2xl font-bold text-[#123B70] dark:text-white tracking-tight">
          {t("passwordResetSuccessTitle")}
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 max-w-sm">
          {t("passwordResetSuccessDesc")}
        </p>

        <div className="mt-6 w-full">
          <Link
            to={PATHS.login}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#123B70] dark:bg-blue-600 hover:bg-[#0c2a52] dark:hover:bg-blue-500 active:bg-[#09203f] dark:active:bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm transition-all"
          >
            <span>{t("returnToSignIn")}</span>
            <Icon name="arrow_forward" size={18} flipRtl />
          </Link>
        </div>
      </div>
    );
  }

  // ==========================================
  // Render: Step 2 — Reset Password with Token
  // ==========================================
  if (step === "reset") {
    // 2a. Token Verifying Loader
    if (verifyingToken) {
      return (
        <div role="status" aria-busy="true" className="flex flex-col gap-3 py-6">
          <span className="sr-only">Verifying security token...</span>
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-1/2" />
        </div>
      );
    }

    // 2b. Invalid or Expired Token State
    if (!tokenValid) {
      return (
        <div className="flex flex-col items-center text-center pt-2">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 shadow-xs mb-4">
            <Icon name="link_off" size={32} />
          </div>

          <h2 className="text-2xl font-bold text-[#123B70] dark:text-white tracking-tight">
            {t("tokenExpiredTitle")}
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 max-w-sm">
            {t("tokenExpiredDesc")}
          </p>

          <div className="mt-6 flex flex-col gap-3 w-full">
            <button
              type="button"
              onClick={handleRequestNewLink}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#123B70] dark:bg-blue-600 hover:bg-[#0c2a52] dark:hover:bg-blue-500 active:bg-[#09203f] dark:active:bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm transition-all cursor-pointer"
            >
              <Icon name="refresh" size={18} />
              <span>{t("requestNewLink")}</span>
            </button>

            <Link
              to={PATHS.login}
              className="inline-flex items-center justify-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:underline pt-1 transition-colors"
            >
              <Icon name="arrow_back" size={15} flipRtl />
              <span>{t("backToSignIn")}</span>
            </Link>
          </div>
        </div>
      );
    }

    // 2c. Valid Token: Enter New Password
    return (
      <div>
        {/* Reset Password Heading */}
        <div className="mt-5 mb-4 text-start">
          <h2 className="text-2xl sm:text-2.5xl font-bold text-[#123B70] dark:text-white tracking-tight transition-colors">
            {t("resetPasswordTitle")}
          </h2>
          <p className="mt-0.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 transition-colors">
            {t("resetPasswordSubtitle")}
          </p>
          <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500 transition-colors">
            {t("resetPasswordDesc")}
          </p>
        </div>

        {/* Email context info if submitted from step 1 */}
        {email && (
          <div className="mb-4 flex items-center justify-between rounded-lg bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/50 px-3 py-2 text-xs text-blue-900 dark:text-blue-200">
            <span className="truncate max-w-[240px]">
              {t("institutionalEmail")}: <strong className="font-semibold">{email}</strong>
            </span>
            <button
              type="button"
              onClick={handleRequestNewLink}
              className="text-xs font-semibold text-[#123B70] dark:text-blue-400 hover:underline shrink-0"
            >
              {t("common:actions.change")}
            </button>
          </div>
        )}

        <form noValidate onSubmit={handleResetSubmit} className="flex flex-col gap-4">
          {resetFormError && (
            <Alert tone="danger" className="text-sm">
              {resetFormError}
            </Alert>
          )}

          {/* New Password Field */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="new-password"
              className="text-xs font-semibold text-[#123B70] dark:text-blue-200 transition-colors"
            >
              {t("newPassword")}
            </label>
            <div className="relative">
              <span
                className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                aria-hidden="true"
              >
                <Icon name="lock" size={19} />
              </span>
              <input
                id="new-password"
                type={showNewPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder={t("newPasswordPlaceholder")}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (passwordErrors.newPassword) {
                    setPasswordErrors((prev) => ({ ...prev, newPassword: undefined }));
                  }
                }}
                aria-invalid={passwordErrors.newPassword ? true : undefined}
                aria-describedby={passwordErrors.newPassword ? "new-password-error" : undefined}
                className={`h-11 w-full rounded-lg border bg-white dark:bg-slate-800/80 ps-11 pe-11 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors focus:border-[#123B70] dark:focus:border-blue-400 focus:ring-2 focus:ring-[#123B70]/15 dark:focus:ring-blue-400/20 focus:outline-none ${
                  passwordErrors.newPassword
                    ? "border-red-500 focus:border-red-500 focus:ring-red-100 dark:focus:ring-red-950/40"
                    : "border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((prev) => !prev)}
                aria-label={showNewPassword ? t("hidePassword") : t("showPassword")}
                className="absolute end-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-slate-400 dark:text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
              >
                <Icon name={showNewPassword ? "visibility_off" : "visibility"} size={19} />
              </button>
            </div>
            {passwordErrors.newPassword && (
              <p
                id="new-password-error"
                className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400"
              >
                <Icon name="error" size={15} />
                <span>{passwordErrors.newPassword}</span>
              </p>
            )}
          </div>

          {/* Confirm New Password Field */}
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="confirm-password"
              className="text-xs font-semibold text-[#123B70] dark:text-blue-200 transition-colors"
            >
              {t("confirmPassword")}
            </label>
            <div className="relative">
              <span
                className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                aria-hidden="true"
              >
                <Icon name="lock" size={19} />
              </span>
              <input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder={t("confirmPasswordPlaceholder")}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (passwordErrors.confirmPassword) {
                    setPasswordErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                  }
                }}
                aria-invalid={passwordErrors.confirmPassword ? true : undefined}
                aria-describedby={
                  passwordErrors.confirmPassword ? "confirm-password-error" : undefined
                }
                className={`h-11 w-full rounded-lg border bg-white dark:bg-slate-800/80 ps-11 pe-11 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors focus:border-[#123B70] dark:focus:border-blue-400 focus:ring-2 focus:ring-[#123B70]/15 dark:focus:ring-blue-400/20 focus:outline-none ${
                  passwordErrors.confirmPassword
                    ? "border-red-500 focus:border-red-500 focus:ring-red-100 dark:focus:ring-red-950/40"
                    : "border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={showConfirmPassword ? t("hidePassword") : t("showPassword")}
                className="absolute end-1.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-md text-slate-400 dark:text-slate-400 transition-colors hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
              >
                <Icon name={showConfirmPassword ? "visibility_off" : "visibility"} size={19} />
              </button>
            </div>
            {passwordErrors.confirmPassword && (
              <p
                id="confirm-password-error"
                className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400"
              >
                <Icon name="error" size={15} />
                <span>{passwordErrors.confirmPassword}</span>
              </p>
            )}
          </div>

          {/* Real-time Password Requirements Checklist */}
          <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-2.5 border border-slate-200/80 dark:border-slate-700/60 text-[11px] space-y-1">
            <p className="font-semibold text-slate-600 dark:text-slate-400">
              {t("passwordRequirementsTitle")}
            </p>
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <Icon
                name={hasMinLength ? "check_circle" : "circle"}
                size={13}
                className={
                  hasMinLength
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-slate-300 dark:text-slate-600"
                }
              />
              <span
                className={hasMinLength ? "text-slate-800 dark:text-slate-200 font-medium" : ""}
              >
                {t("reqMinLength")}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <Icon
                name={hasLettersAndNumbers ? "check_circle" : "circle"}
                size={13}
                className={
                  hasLettersAndNumbers
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-slate-300 dark:text-slate-600"
                }
              />
              <span
                className={
                  hasLettersAndNumbers ? "text-slate-800 dark:text-slate-200 font-medium" : ""
                }
              >
                {t("reqLettersNumbers")}
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={resetSubmitting}
            className="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#123B70] dark:bg-blue-600 hover:bg-[#0c2a52] dark:hover:bg-blue-500 active:bg-[#09203f] dark:active:bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm dark:shadow-blue-950/40 transition-all disabled:pointer-events-none disabled:opacity-60 cursor-pointer"
          >
            {resetSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                <span>{t("resetPasswordAction")}...</span>
              </span>
            ) : (
              <>
                <span>{t("resetPasswordAction")}</span>
                <Icon name="arrow_forward" size={18} flipRtl />
              </>
            )}
          </button>

          {/* Navigation Links */}
          <div className="flex items-center justify-between pt-2 text-xs">
            <button
              type="button"
              onClick={handleRequestNewLink}
              className="text-slate-500 dark:text-slate-400 hover:text-[#123B70] dark:hover:text-blue-300 hover:underline transition-colors"
            >
              {t("requestNewLink")}
            </button>
            <Link
              to={PATHS.login}
              className="inline-flex items-center gap-1 font-semibold text-[#123B70] dark:text-blue-400 hover:text-[#0a2347] dark:hover:text-blue-300 hover:underline transition-colors"
            >
              <Icon name="arrow_back" size={15} flipRtl />
              <span>{t("backToSignIn")}</span>
            </Link>
          </div>
        </form>
      </div>
    );
  }

  // ==========================================
  // Render: Step 1 — Request Reset Link Form
  // ==========================================
  return (
    <div>
      {/* Forgot Password Heading */}
      <div className="mt-5 mb-4 text-start">
        <h2 className="text-2xl sm:text-2.5xl font-bold text-[#123B70] dark:text-white tracking-tight transition-colors">
          {t("forgotPasswordTitle")}
        </h2>
        <p className="mt-0.5 text-xs sm:text-sm text-slate-500 dark:text-slate-400 transition-colors">
          {t("forgotPasswordSubtitle")}
        </p>
        <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500 transition-colors">
          {t("forgotPasswordDesc")}
        </p>
      </div>

      <form noValidate onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
        {requestFormError && (
          <Alert tone="danger" className="text-sm">
            {requestFormError}
          </Alert>
        )}

        {/* Institutional Email Field */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="forgot-email"
            className="text-xs font-semibold text-[#123B70] dark:text-blue-200 transition-colors"
          >
            {t("institutionalEmail")}
          </label>
          <div className="relative">
            <span
              className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
              aria-hidden="true"
            >
              <Icon name="mail" size={19} />
            </span>
            <input
              id="forgot-email"
              type="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              placeholder={t("institutionalEmailPlaceholder")}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError(null);
              }}
              aria-invalid={emailError ? true : undefined}
              aria-describedby={emailError ? "forgot-email-error" : undefined}
              className={`h-11 w-full rounded-lg border bg-white dark:bg-slate-800/80 ps-11 pe-4 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors focus:border-[#123B70] dark:focus:border-blue-400 focus:ring-2 focus:ring-[#123B70]/15 dark:focus:ring-blue-400/20 focus:outline-none ${
                emailError
                  ? "border-red-500 focus:border-red-500 focus:ring-red-100 dark:focus:ring-red-950/40"
                  : "border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600"
              }`}
            />
          </div>
          {emailError && (
            <p
              id="forgot-email-error"
              className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400"
            >
              <Icon name="error" size={15} />
              <span>{emailError}</span>
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={requestSubmitting}
          className="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#123B70] dark:bg-blue-600 hover:bg-[#0c2a52] dark:hover:bg-blue-500 active:bg-[#09203f] dark:active:bg-blue-700 px-4 text-sm font-semibold text-white shadow-sm dark:shadow-blue-950/40 transition-all disabled:pointer-events-none disabled:opacity-60 cursor-pointer"
        >
          {requestSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              <span>{t("sendResetLink")}...</span>
            </span>
          ) : (
            <>
              <span>{t("sendResetLink")}</span>
              <Icon name="arrow_forward" size={18} flipRtl />
            </>
          )}
        </button>

        {/* Return to Sign In */}
        <div className="pt-2 text-center">
          <Link
            to={PATHS.login}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#123B70] dark:text-blue-400 hover:text-[#0a2347] dark:hover:text-blue-300 hover:underline transition-colors"
          >
            <Icon name="arrow_back" size={16} flipRtl />
            <span>{t("backToSignIn")}</span>
          </Link>
        </div>
      </form>
    </div>
  );
}
