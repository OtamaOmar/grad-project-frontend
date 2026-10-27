import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Checkbox,
  Dialog,
  ErrorState,
  Field,
  Input,
  Select,
  Skeleton,
  Switch,
} from "@/components/ui";
import { useToast } from "@/hooks/useToast";
import { serverFieldError } from "./courseFormat";
import { useCourse, useCreateCourse, useUpdateCourse } from "./useCourses";

const COMPONENT_TYPES = ["lecture", "tutorial", "lab"];
const LAB_KINDS = ["computing", "physics_circuits"];
const FLAGS = ["counts_toward_degree", "counts_in_gpa", "counts_toward_registration_cap"];

/**
 * Create (no `courseId`) or edit a course, including its weekly components.
 * Editing loads the course detail first so the components editor starts from stored rows.
 */
export function CourseFormDialog({ courseId, bylaws, defaultBylawId, onClose, onSaved }) {
  const { t } = useTranslation(["adminCourses", "common"]);
  const editing = Boolean(courseId);
  const detail = useCourse(courseId);

  if (editing && !detail.data) {
    return (
      <Dialog open onClose={onClose} title={t("form.editTitle")} size="lg">
        {detail.isError ? (
          <ErrorState error={detail.error} onRetry={detail.refetch} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2" aria-busy="true">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        )}
      </Dialog>
    );
  }

  return (
    <CourseForm
      course={detail.data}
      bylaws={bylaws}
      defaultBylawId={defaultBylawId}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}

const flagToValue = (flag) => (flag === null || flag === undefined ? "unstated" : String(flag));
const valueToFlag = (value) => (value === "unstated" ? null : value === "true");

function initialComponents(course) {
  return Object.fromEntries(
    COMPONENT_TYPES.map((type) => {
      const row = course?.components?.find((item) => item.component_type === type);
      return [
        type,
        {
          enabled: Boolean(row),
          hours: row ? String(row.weekly_contact_hours) : "",
          lab_kind: row?.lab_kind ?? "",
        },
      ];
    }),
  );
}

function CourseForm({ course, bylaws, defaultBylawId, onClose, onSaved }) {
  const { t } = useTranslation(["adminCourses", "common"]);
  const toast = useToast();
  const editing = Boolean(course);
  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();
  const mutation = editing ? updateCourse : createCourse;
  const error = mutation.error;

  const [values, setValues] = useState({
    bylaw_id: String(course?.bylaw_id ?? defaultBylawId ?? bylaws[0]?.bylaw_id ?? ""),
    code: course?.code ?? "",
    title: course?.title ?? "",
    credits: course ? String(course.credits) : "3",
    source_reference: course?.source_reference ?? "",
    is_active: course?.is_active ?? true,
    ...Object.fromEntries(FLAGS.map((flag) => [flag, flagToValue(course?.[flag])])),
  });
  const [components, setComponents] = useState(() => initialComponents(course));
  const [touched, setTouched] = useState(false);

  const required = t("common:states.required");
  const credits = Number(values.credits);
  const errors = {
    bylaw_id: !values.bylaw_id ? required : serverFieldError(error, "bylaw_id"),
    code: !values.code.trim() ? required : serverFieldError(error, "code"),
    title: !values.title.trim() ? required : serverFieldError(error, "title"),
    credits:
      values.credits === "" || !Number.isInteger(credits) || credits < 0
        ? t("form.creditsInvalid")
        : serverFieldError(error, "credits"),
    source_reference: !values.source_reference.trim()
      ? required
      : serverFieldError(error, "source_reference"),
  };
  const componentErrors = Object.fromEntries(
    COMPONENT_TYPES.map((type) => {
      const row = components[type];
      const hours = Number(row.hours);
      if (!row.enabled) return [type, null];
      if (!Number.isInteger(hours) || hours <= 0)
        return [type, touched ? t("form.hoursInvalid") : null];
      return [type, serverFieldError(error, `components.${enabledIndex(components, type)}`)];
    }),
  );
  const clientInvalid =
    !values.bylaw_id ||
    !values.code.trim() ||
    !values.title.trim() ||
    !values.source_reference.trim() ||
    values.credits === "" ||
    !Number.isInteger(credits) ||
    credits < 0 ||
    COMPONENT_TYPES.some((type) => {
      const row = components[type];
      const hours = Number(row.hours);
      return row.enabled && (!Number.isInteger(hours) || hours <= 0);
    });
  const show = (message, field) =>
    touched || (field && error?.details?.fields?.[field]) ? message : null;

  const set = (field) => (event) => setValues((v) => ({ ...v, [field]: event.target.value }));
  const setComponent = (type, changes) =>
    setComponents((current) => ({ ...current, [type]: { ...current[type], ...changes } }));

  const submit = (event) => {
    event.preventDefault();
    setTouched(true);
    if (clientInvalid) return;
    const body = {
      code: values.code.trim(),
      title: values.title.trim(),
      credits,
      source_reference: values.source_reference.trim(),
      is_active: values.is_active,
      ...Object.fromEntries(FLAGS.map((flag) => [flag, valueToFlag(values[flag])])),
      components: COMPONENT_TYPES.filter((type) => components[type].enabled).map((type) => ({
        component_type: type,
        weekly_contact_hours: Number(components[type].hours),
        ...(type === "lab" && components.lab.lab_kind ? { lab_kind: components.lab.lab_kind } : {}),
      })),
    };
    const onSuccess = (saved) => {
      toast.success(t(editing ? "toast.updated" : "toast.created", { code: saved.code }));
      onSaved?.(saved);
      onClose();
    };
    if (editing) updateCourse.mutate({ id: course.id, ...body }, { onSuccess });
    else createCourse.mutate({ ...body, bylaw_id: Number(values.bylaw_id) }, { onSuccess });
  };

  const knownFieldError =
    error &&
    Object.keys(error.details?.fields ?? {}).some(
      (field) => field in errors || field.startsWith("components."),
    );

  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      title={editing ? t("form.editTitle") : t("form.createTitle")}
      description={editing ? course.code : t("form.createDescription")}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t("common:actions.cancel")}
          </Button>
          <Button type="submit" form="course-form" loading={mutation.isPending}>
            {editing ? t("form.save") : t("form.create")}
          </Button>
        </>
      }
    >
      <form id="course-form" noValidate onSubmit={submit} className="flex flex-col gap-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={t("form.bylaw")}
            hint={editing ? t("form.bylawImmutable") : null}
            error={show(errors.bylaw_id, "bylaw_id")}
            required
          >
            {(props) => (
              <Select
                {...props}
                disabled={editing}
                value={values.bylaw_id}
                onChange={set("bylaw_id")}
                options={bylaws.map((bylaw) => ({
                  value: String(bylaw.bylaw_id),
                  label: t(`bylaw.long.${bylaw.bylaw_code}`, { defaultValue: bylaw.bylaw_code }),
                }))}
              />
            )}
          </Field>
          <Field
            label={t("form.code")}
            hint={t("form.codeHint")}
            error={show(errors.code, "code")}
            required
          >
            {(props) => (
              <Input
                {...props}
                dir="ltr"
                autoCapitalize="characters"
                spellCheck={false}
                placeholder="CSCI 207"
                value={values.code}
                onChange={set("code")}
              />
            )}
          </Field>
          <Field
            label={t("form.title")}
            error={show(errors.title, "title")}
            required
            className="sm:col-span-2"
          >
            {(props) => <Input {...props} value={values.title} onChange={set("title")} />}
          </Field>
          <Field label={t("form.credits")} error={show(errors.credits, "credits")} required>
            {(props) => (
              <Input
                {...props}
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                value={values.credits}
                onChange={set("credits")}
              />
            )}
          </Field>
          <Field
            label={t("form.sourceReference")}
            hint={t("form.sourceReferenceHint")}
            error={show(errors.source_reference, "source_reference")}
            required
          >
            {(props) => (
              <Input
                {...props}
                value={values.source_reference}
                onChange={set("source_reference")}
              />
            )}
          </Field>
        </div>

        <fieldset className="grid gap-4 sm:grid-cols-3">
          <legend className="mb-2 text-label-md font-semibold text-on-surface">
            {t("form.flags")}
          </legend>
          {FLAGS.map((flag) => (
            <Field key={flag} label={t(`flags.${flag}`)} error={serverFieldError(error, flag)}>
              {(props) => (
                <Select
                  {...props}
                  value={values[flag]}
                  onChange={set(flag)}
                  options={[
                    { value: "unstated", label: t("flags.unstated") },
                    { value: "true", label: t("flags.yes") },
                    { value: "false", label: t("flags.no") },
                  ]}
                />
              )}
            </Field>
          ))}
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-label-md font-semibold text-on-surface">
            {t("form.components")}
          </legend>
          <p className="text-body-sm text-on-surface-variant">{t("form.componentsHint")}</p>
          {COMPONENT_TYPES.map((type) => {
            const row = components[type];
            const message = componentErrors[type];
            return (
              <div
                key={type}
                className="grid items-start gap-3 rounded-lg border border-outline-variant/70 p-3 sm:grid-cols-[10rem_1fr_1fr]"
              >
                <Checkbox
                  className="h-10"
                  label={t(`components.type.${type}`)}
                  checked={row.enabled}
                  onChange={(event) => setComponent(type, { enabled: event.target.checked })}
                />
                <Field error={message}>
                  {(props) => (
                    <Input
                      {...props}
                      type="number"
                      inputMode="numeric"
                      min={1}
                      step={1}
                      aria-label={t("form.weeklyHoursFor", {
                        type: t(`components.type.${type}`),
                      })}
                      placeholder={t("form.weeklyHours")}
                      disabled={!row.enabled}
                      value={row.hours}
                      onChange={(event) => setComponent(type, { hours: event.target.value })}
                    />
                  )}
                </Field>
                {type === "lab" ? (
                  <Select
                    aria-label={t("form.labKind")}
                    disabled={!row.enabled}
                    value={row.lab_kind}
                    onChange={(event) => setComponent(type, { lab_kind: event.target.value })}
                    options={[
                      { value: "", label: t("form.labKindUnstated") },
                      ...LAB_KINDS.map((kind) => ({ value: kind, label: t(`labKind.${kind}`) })),
                    ]}
                  />
                ) : (
                  <span className="hidden sm:block" />
                )}
              </div>
            );
          })}
        </fieldset>

        <Switch
          label={t("form.isActive")}
          checked={values.is_active}
          onChange={(checked) => setValues((v) => ({ ...v, is_active: checked }))}
        />

        {error && !knownFieldError && (
          <p role="alert" className="text-body-sm text-error">
            {error.message}
          </p>
        )}
      </form>
    </Dialog>
  );
}

/** Index of `type` in the submitted components list (server errors use that index). */
function enabledIndex(components, type) {
  return COMPONENT_TYPES.filter((item) => components[item].enabled).indexOf(type);
}
