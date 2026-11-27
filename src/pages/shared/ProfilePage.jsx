import { useId, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Avatar, Badge, Button, Card, Icon } from "@/components/ui";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { useToast } from "@/hooks/useToast";
import { ChangePasswordDialog } from "@/features/auth/ChangePasswordDialog";
import { authApi } from "@/services/api/auth";
import { cn } from "@/utils/cn";

export default function ProfilePage() {
  const { t, i18n } = useTranslation(["profile", "common"]);
  const { user, signOut, refresh } = useAuth();
  const { theme, setTheme } = useTheme();
  const toast = useToast();

  const currentLang = i18n.resolvedLanguage || "en";

  // Form editable state (draft overrides session values until saved or reset)
  const [fullNameDraft, setFullNameDraft] = useState(null);
  const [phoneDraft, setPhoneDraft] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);

  const fullName = fullNameDraft ?? user?.displayName ?? "";
  const phone = phoneDraft ?? user?.phone ?? "+20 100 123 4567";

  const role = user?.role || "student";

  // Resolved institutional identifier
  const identifierInfo = useMemo(() => {
    if (role === "student") {
      return {
        label: t("fields.studentId"),
        value: user?.studentId ? "2025-0142" : "2025-0142",
      };
    }
    return {
      label: t("fields.staffCode"),
      value:
        user?.staffCode ||
        (role === "admin" ? "ADM-002" : role === "coordinator" ? "8841-CS" : "FAC-104"),
    };
  }, [role, user, t]);

  const roleBadgeTone = useMemo(() => {
    switch (role) {
      case "admin":
        return "danger";
      case "coordinator":
        return "info";
      case "advisor":
        return "success";
      default:
        return "primary";
    }
  }, [role]);

  const academicTag = useMemo(() => {
    switch (role) {
      case "student":
        return t("identity.registered");
      case "admin":
        return t("identity.adminScope");
      default:
        return t("identity.tenured");
    }
  }, [role, t]);

  const handleLanguageSelect = (newLang) => {
    if (newLang !== currentLang) {
      i18n.changeLanguage(newLang);
    }
  };

  const handleThemeSelect = (newTheme) => {
    if (newTheme !== theme) {
      setTheme(newTheme);
    }
  };

  const handleReset = () => {
    setFullNameDraft(null);
    setPhoneDraft(null);
  };

  const handleSave = async (e) => {
    e?.preventDefault?.();
    setIsSaving(true);
    try {
      await authApi.saveOnboarding({
        full_name: fullName.trim() || user?.displayName,
        phone: phone.trim(),
        preferred_language: currentLang,
        preferred_theme: theme,
      });
      setFullNameDraft(null);
      setPhoneDraft(null);
      await refresh();
      toast.success(t("actions.successToast"));
    } catch {
      toast.error(t("actions.errorToast"));
    } finally {
      setIsSaving(false);
    }
  };

  const fullNameId = useId();
  const emailId = useId();
  const phoneId = useId();
  const idFieldId = useId();
  const deptId = useId();

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 pb-12">
      {/* 1. Academic Header Context & Meta */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-label-sm uppercase tracking-wider text-on-surface-variant">
            <span>
              {t("meta.directory")} · {identifierInfo.label} #{identifierInfo.value}
            </span>
            <span className="size-1.5 rounded-full bg-outline" />
            <span>{t("meta.academicYear")}</span>
          </div>
          <h1 className="font-serif text-headline-xl font-semibold text-on-surface">
            {t("meta.title")}
          </h1>
          <p className="mt-1 text-body-md text-on-surface-variant">{t("meta.subtitle")}</p>
        </div>

        {/* Nile Single Sign-On Badge */}
        <div className="flex items-center gap-3 rounded-lg border border-outline-variant/70 bg-surface-container-low px-4 py-2.5 shadow-sm">
          <Icon name="verified_user" size={24} className="text-primary" />
          <div className="flex flex-col">
            <span className="text-label-sm font-semibold text-on-surface">
              {t("meta.ssoActive")}
            </span>
            <span className="text-body-xs text-on-surface-variant">{t("meta.ssoSync")}</span>
          </div>
        </div>
      </div>

      {/* 2. Main Profile Form Card */}
      <Card className="p-6 sm:p-8">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Identity Summary Row */}
          <div className="flex items-center gap-4 border-b border-outline-variant/60 pb-6">
            <div className="relative">
              <Avatar name={fullName || user?.displayName || "NU"} size="lg" strong />
              <div
                className="absolute -bottom-1 -end-1 flex size-5 items-center justify-center rounded-full bg-primary text-on-primary shadow-sm"
                title="Verified Nile University Member"
              >
                <Icon name="school" size={13} />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate font-serif text-headline-md font-semibold text-on-surface">
                  {fullName || user?.displayName || "Nile User"}
                </h2>
                <Badge tone={roleBadgeTone}>{role.charAt(0).toUpperCase() + role.slice(1)}</Badge>
                <Badge tone="neutral">{academicTag}</Badge>
              </div>
              <p className="mt-0.5 truncate text-body-sm text-on-surface-variant">
                {t("identity.faculty")} · Department of Computer Science
              </p>
            </div>
          </div>

          {/* Form Fields Grid */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* Full Name */}
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label htmlFor={fullNameId} className="text-label-md font-semibold text-on-surface">
                {t("fields.fullName")}
              </label>
              <div className="relative">
                <input
                  id={fullNameId}
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullNameDraft(e.target.value)}
                  className="h-10 w-full rounded-md border border-outline-variant bg-surface-container-lowest px-3 ps-10 text-body-md text-on-surface transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <Icon
                  name="person"
                  size={20}
                  className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
                />
              </div>
              <p className="text-body-xs text-on-surface-variant">{t("fields.fullNameHint")}</p>
            </div>

            {/* University Email (Read-only) */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor={emailId} className="text-label-md font-semibold text-on-surface">
                {t("fields.email")}
              </label>
              <div className="relative">
                <input
                  id={emailId}
                  type="email"
                  readOnly
                  value={`${user?.username || "user"}@nu.edu.eg`}
                  className="h-10 w-full cursor-not-allowed rounded-md border border-outline-variant bg-surface-container-low px-3 ps-10 text-body-md text-on-surface-variant"
                />
                <Icon
                  name="mail"
                  size={20}
                  className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
                />
              </div>
              <p className="text-body-xs text-on-surface-variant">{t("fields.emailHint")}</p>
            </div>

            {/* Contact Phone Number */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor={phoneId} className="text-label-md font-semibold text-on-surface">
                {t("fields.phone")}
              </label>
              <div className="relative">
                <input
                  id={phoneId}
                  type="text"
                  value={phone}
                  onChange={(e) => setPhoneDraft(e.target.value)}
                  className="h-10 w-full rounded-md border border-outline-variant bg-surface-container-lowest px-3 ps-10 text-body-md text-on-surface transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <Icon
                  name="phone"
                  size={20}
                  className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
                />
              </div>
              <p className="text-body-xs text-on-surface-variant">{t("fields.phoneHint")}</p>
            </div>

            {/* Institutional Identifier (Read-only) */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor={idFieldId} className="text-label-md font-semibold text-on-surface">
                {identifierInfo.label}
              </label>
              <div className="relative">
                <input
                  id={idFieldId}
                  type="text"
                  readOnly
                  value={identifierInfo.value}
                  className="h-10 w-full cursor-not-allowed rounded-md border border-outline-variant bg-surface-container-low px-3 ps-10 font-mono text-body-md font-semibold text-on-surface"
                />
                <Icon
                  name="badge"
                  size={20}
                  className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
                />
              </div>
              <p className="text-body-xs text-on-surface-variant">{t("fields.identifierHint")}</p>
            </div>

            {/* Academic Department (Read-only) */}
            <div className="flex flex-col gap-1.5">
              <label htmlFor={deptId} className="text-label-md font-semibold text-on-surface">
                {t("fields.department")}
              </label>
              <div className="relative">
                <input
                  id={deptId}
                  type="text"
                  readOnly
                  value="Department of Computer Science"
                  className="h-10 w-full cursor-not-allowed rounded-md border border-outline-variant bg-surface-container-low px-3 ps-10 text-body-md text-on-surface-variant"
                />
                <Icon
                  name="domain"
                  size={20}
                  className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
                />
              </div>
              <p className="text-body-xs text-on-surface-variant">{t("identity.faculty")}</p>
            </div>
          </div>

          {/* System Role & Permissions (Read-only Governance Specification) */}
          <div className="space-y-1.5 rounded-lg border border-outline-variant/60 bg-surface-container-low/60 p-4">
            <div className="flex items-center justify-between">
              <span className="text-label-md font-semibold text-on-surface">
                {t("fields.role")}
              </span>
              <Badge tone={roleBadgeTone} icon="lock">
                {role === "student" ? t("fields.restricted") : t("fields.verified")}
              </Badge>
            </div>
            <div className="flex items-center gap-2 pt-1 text-body-md text-on-surface">
              <Icon name="verified" size={18} className="text-primary" />
              <span className="font-semibold">
                {role.toUpperCase()} — {academicTag}
              </span>
            </div>
            <p className="flex items-center gap-1.5 pt-1 text-body-xs text-on-surface-variant">
              <Icon name="info" size={15} />
              <span>{t("fields.roleDesc")}</span>
            </p>
          </div>

          {/* 3. Curriculum Interface Language Preference */}
          <div className="space-y-2 pt-2">
            <label className="block text-label-md font-semibold text-on-surface">
              {t("preferences.langTitle")}
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* English */}
              <button
                type="button"
                onClick={() => handleLanguageSelect("en")}
                className={cn(
                  "pressable flex items-center justify-between rounded-lg border p-4 text-start",
                  currentLang === "en"
                    ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary"
                    : "border-outline-variant bg-surface-container-low hover:border-outline",
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex size-4 items-center justify-center rounded-full border",
                      currentLang === "en"
                        ? "border-primary bg-primary text-on-primary"
                        : "border-outline",
                    )}
                  >
                    {currentLang === "en" && (
                      <span className="size-1.5 rounded-full bg-on-primary" />
                    )}
                  </span>
                  <div>
                    <div className="text-label-md font-semibold text-on-surface">
                      {t("preferences.enOption")}
                    </div>
                    <div className="text-body-xs text-on-surface-variant">
                      {t("preferences.enDesc")}
                    </div>
                  </div>
                </div>
                <span className="rounded bg-surface-container px-2 py-0.5 font-mono text-label-sm text-on-surface-variant">
                  LTR
                </span>
              </button>

              {/* Arabic */}
              <button
                type="button"
                onClick={() => handleLanguageSelect("ar")}
                className={cn(
                  "pressable flex items-center justify-between rounded-lg border p-4 text-start",
                  currentLang === "ar"
                    ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary"
                    : "border-outline-variant bg-surface-container-low hover:border-outline",
                )}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex size-4 items-center justify-center rounded-full border",
                      currentLang === "ar"
                        ? "border-primary bg-primary text-on-primary"
                        : "border-outline",
                    )}
                  >
                    {currentLang === "ar" && (
                      <span className="size-1.5 rounded-full bg-on-primary" />
                    )}
                  </span>
                  <div>
                    <div className="text-label-md font-semibold text-on-surface font-sans">
                      {t("preferences.arOption")}
                    </div>
                    <div className="text-body-xs text-on-surface-variant">
                      {t("preferences.arDesc")}
                    </div>
                  </div>
                </div>
                <span className="rounded bg-surface-container px-2 py-0.5 font-mono text-label-sm text-on-surface-variant">
                  RTL
                </span>
              </button>
            </div>
          </div>

          {/* 4. Workspace Visual Theme Preference */}
          <div className="space-y-2 pt-2">
            <label className="block text-label-md font-semibold text-on-surface">
              {t("preferences.themeTitle")}
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Light Theme */}
              <button
                type="button"
                onClick={() => handleThemeSelect("light")}
                className={cn(
                  "pressable flex flex-col rounded-lg border p-4 text-start",
                  theme === "light"
                    ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary"
                    : "border-outline-variant bg-surface-container-low hover:border-outline",
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Icon name="light_mode" size={18} className="text-primary" />
                    <span className="text-label-md font-semibold text-on-surface">
                      {t("preferences.themeLight")}
                    </span>
                  </div>
                  {theme === "light" ? (
                    <Icon name="check_circle" size={18} className="text-primary" />
                  ) : (
                    <span className="size-4 rounded-full border border-outline" />
                  )}
                </div>
                <p className="mt-1 text-body-xs text-on-surface-variant">
                  {t("preferences.themeLightDesc")}
                </p>
                <div className="mt-3 flex items-center gap-2 border-t border-outline-variant/60 pt-2">
                  <div className="flex items-center gap-1.5">
                    <span className="size-4 rounded bg-[#021F94]" title="Primary #021F94" />
                    <span
                      className="size-4 rounded border border-outline-variant bg-[#F5F2F3]"
                      title="Surface Canvas #F5F2F3"
                    />
                  </div>
                  <span className="ms-auto font-mono text-body-xs text-on-surface-variant">
                    #021F94 / #F5F2F3
                  </span>
                </div>
              </button>

              {/* Dark Theme */}
              <button
                type="button"
                onClick={() => handleThemeSelect("dark")}
                className={cn(
                  "pressable flex flex-col rounded-lg border p-4 text-start",
                  theme === "dark"
                    ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary"
                    : "border-outline-variant bg-surface-container-low hover:border-outline",
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Icon name="dark_mode" size={18} className="text-primary" />
                    <span className="text-label-md font-semibold text-on-surface">
                      {t("preferences.themeDark")}
                    </span>
                  </div>
                  {theme === "dark" ? (
                    <Icon name="check_circle" size={18} className="text-primary" />
                  ) : (
                    <span className="size-4 rounded-full border border-outline" />
                  )}
                </div>
                <p className="mt-1 text-body-xs text-on-surface-variant">
                  {t("preferences.themeDarkDesc")}
                </p>
                <div className="mt-3 flex items-center gap-2 border-t border-outline-variant/60 pt-2">
                  <div className="flex items-center gap-1.5">
                    <span className="size-4 rounded bg-[#6B8CFF]" title="Dark Accent #6B8CFF" />
                    <span className="size-4 rounded bg-[#080D1F]" title="Dark Canvas #080D1F" />
                  </div>
                  <span className="ms-auto font-mono text-body-xs text-on-surface-variant">
                    #6B8CFF / #080D1F
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* 5. Role-Specific Academic Context Card */}
          <div className="rounded-xl border border-outline-variant/70 bg-surface-container-low p-5">
            {role === "student" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-label-lg font-semibold text-on-surface">
                  <Icon name="school" size={20} className="text-primary" />
                  <span>{t("roles.student.title")}</span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-3">
                    <div className="text-body-xs text-on-surface-variant">
                      {t("roles.student.standing")}
                    </div>
                    <div className="mt-0.5 text-label-md font-semibold text-success">
                      {t("roles.student.standingVal")}
                    </div>
                  </div>
                  <div className="rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-3">
                    <div className="text-body-xs text-on-surface-variant">
                      {t("roles.student.cohort")}
                    </div>
                    <div className="mt-0.5 text-label-md font-semibold text-on-surface">
                      {t("roles.student.cohortVal")}
                    </div>
                  </div>
                  <div className="rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-3">
                    <div className="text-body-xs text-on-surface-variant">
                      {t("roles.student.creditHours")}
                    </div>
                    <div className="mt-0.5 text-label-md font-semibold text-on-surface">
                      {t("roles.student.creditHoursVal")}
                    </div>
                  </div>
                  <div className="rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-3">
                    <div className="text-body-xs text-on-surface-variant">
                      {t("roles.student.program")}
                    </div>
                    <div className="mt-0.5 text-label-md font-semibold text-on-surface">
                      {t("roles.student.programVal")}
                    </div>
                  </div>
                  <div className="rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-3 sm:col-span-2">
                    <div className="text-body-xs text-on-surface-variant">
                      {t("roles.student.path")}
                    </div>
                    <div className="mt-0.5 text-label-md font-semibold text-on-surface">
                      {t("roles.student.pathVal")}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {role === "coordinator" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-label-lg font-semibold text-on-surface">
                  <Icon name="tune" size={20} className="text-primary" />
                  <span>{t("roles.coordinator.title")}</span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-3">
                    <div className="text-body-xs text-on-surface-variant">
                      {t("roles.coordinator.scope")}
                    </div>
                    <div className="mt-0.5 text-label-md font-semibold text-on-surface">
                      {t("roles.coordinator.scopeVal")}
                    </div>
                  </div>
                  <div className="rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-3">
                    <div className="text-body-xs text-on-surface-variant">
                      {t("roles.coordinator.load")}
                    </div>
                    <div className="mt-0.5 text-label-md font-semibold text-on-surface">
                      {t("roles.coordinator.loadVal")}
                    </div>
                  </div>
                  <div className="rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-3 sm:col-span-2">
                    <div className="text-body-xs text-on-surface-variant">
                      {t("roles.coordinator.supervision")}
                    </div>
                    <div className="mt-0.5 font-mono text-label-md font-semibold text-primary">
                      {t("roles.coordinator.supervisionVal")}
                    </div>
                  </div>
                  <div className="rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-3 sm:col-span-2">
                    <div className="text-body-xs text-on-surface-variant">
                      {t("roles.coordinator.committee")}
                    </div>
                    <div className="mt-0.5 text-label-md font-semibold text-on-surface">
                      {t("roles.coordinator.committeeVal")}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {role === "advisor" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-label-lg font-semibold text-on-surface">
                  <Icon name="supervised_user_circle" size={20} className="text-primary" />
                  <span>{t("roles.advisor.title")}</span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-3">
                    <div className="text-body-xs text-on-surface-variant">
                      {t("roles.advisor.caseload")}
                    </div>
                    <div className="mt-0.5 text-label-md font-semibold text-on-surface">
                      {t("roles.advisor.caseloadVal")}
                    </div>
                  </div>
                  <div className="rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-3">
                    <div className="text-body-xs text-on-surface-variant">
                      {t("roles.advisor.unit")}
                    </div>
                    <div className="mt-0.5 text-label-md font-semibold text-on-surface">
                      {t("roles.advisor.unitVal")}
                    </div>
                  </div>
                  <div className="rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-3">
                    <div className="text-body-xs text-on-surface-variant">
                      {t("roles.advisor.office")}
                    </div>
                    <div className="mt-0.5 text-label-md font-semibold text-on-surface">
                      {t("roles.advisor.officeVal")}
                    </div>
                  </div>
                  <div className="rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-3">
                    <div className="text-body-xs text-on-surface-variant">
                      {t("roles.advisor.hours")}
                    </div>
                    <div className="mt-0.5 text-label-md font-semibold text-on-surface">
                      {t("roles.advisor.hoursVal")}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {role === "admin" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-label-lg font-semibold text-on-surface">
                  <Icon name="admin_panel_settings" size={20} className="text-primary" />
                  <span>{t("roles.admin.title")}</span>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-3">
                    <div className="text-body-xs text-on-surface-variant">
                      {t("roles.admin.level")}
                    </div>
                    <div className="mt-0.5 text-label-md font-semibold text-error">
                      {t("roles.admin.levelVal")}
                    </div>
                  </div>
                  <div className="rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-3">
                    <div className="text-body-xs text-on-surface-variant">
                      {t("roles.admin.audit")}
                    </div>
                    <div className="mt-0.5 text-label-md font-semibold text-on-surface">
                      {t("roles.admin.auditVal")}
                    </div>
                  </div>
                  <div className="rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-3 sm:col-span-2">
                    <div className="text-body-xs text-on-surface-variant">
                      {t("roles.admin.scope")}
                    </div>
                    <div className="mt-0.5 text-label-md font-semibold text-on-surface">
                      {t("roles.admin.scopeVal")}
                    </div>
                  </div>
                  <div className="rounded-lg border border-outline-variant/60 bg-surface-container-lowest p-3 sm:col-span-2">
                    <div className="text-body-xs text-on-surface-variant">
                      {t("roles.admin.bylawAdmin")}
                    </div>
                    <div className="mt-0.5 text-label-md font-semibold text-on-surface">
                      {t("roles.admin.bylawAdminVal")}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 6. Form Actions Footer */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-outline-variant/70 pt-5">
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" variant="primary" icon="save" loading={isSaving}>
                {isSaving ? t("actions.saving") : t("actions.save")}
              </Button>
              <Button type="button" variant="secondary" onClick={handleReset} disabled={isSaving}>
                {t("actions.cancel")}
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                icon="lock_reset"
                onClick={() => setPasswordOpen(true)}
              >
                {t("actions.changePassword")}
              </Button>
              <Button
                type="button"
                variant="ghost"
                icon="logout"
                onClick={signOut}
                className="text-error hover:bg-error-container/20"
              >
                {t("actions.signOut")}
              </Button>
            </div>
          </div>
        </form>
      </Card>

      {/* 7. Institutional Governance & Compliance Audit Notice */}
      <Card className="border-primary/20 bg-surface-container-low p-5">
        <div className="flex items-start gap-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon name="policy" size={22} />
          </div>
          <div className="space-y-1">
            <h3 className="text-label-md font-semibold text-on-surface">{t("compliance.title")}</h3>
            <p className="text-body-sm text-on-surface-variant">{t("compliance.text")}</p>
          </div>
        </div>
      </Card>
      <ChangePasswordDialog open={passwordOpen} onClose={() => setPasswordOpen(false)} />
    </div>
  );
}
