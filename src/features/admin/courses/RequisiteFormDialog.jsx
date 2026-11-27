import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Button, Dialog, Field, Input, Select } from "@/components/ui";
import { useToast } from "@/hooks/useToast";
import { formatNumber } from "@/utils/format";
import { serverFieldError } from "./courseFormat";
import { useAddRequisite, useCourse, useCourseOptions, useStandingBands } from "./useCourses";

// Placement requisites need a placement lookup endpoint, which the admin API does not expose.
const TYPES = ["course", "standing"];
const TARGET_FIELD = { course: "required_course_id", standing: "standing_band_id" };

/**
 * "Append rule edge": adds one requisite to a course. With `course` the course is fixed
 * (opened from the detail drawer); without it the admin picks bylaw + course first.
 * Same group = AND (all required); a new group = an alternative path (OR).
 */
export function RequisiteFormDialog({
  open = true,
  course: fixedCourse,
  bylaws,
  defaultBylawId,
  onClose,
}) {
  const { t } = useTranslation(["adminCourses", "common"]);
  const toast = useToast();
  const addRequisite = useAddRequisite();
  const error = addRequisite.error;

  const [values, setValues] = useState({
    bylaw_id: String(fixedCourse?.bylaw_id ?? defaultBylawId ?? bylaws[0]?.bylaw_id ?? ""),
    course_id: fixedCourse ? String(fixedCourse.id) : "",
    requisite_type: "course",
    target_id: "",
    group_number: "1",
    source_reference: "",
  });
  const [touched, setTouched] = useState(false);

  const courseOptions = useCourseOptions(values.bylaw_id);
  const standingBands = useStandingBands(values.bylaw_id, values.requisite_type === "standing");
  const detail = useCourse(values.course_id);

  const groups = detail.data?.requisite_groups ?? [];
  const nextGroup = groups.reduce((max, group) => Math.max(max, group.group_number), 0) + 1;
  const groupOptions = [
    ...groups.map((group) => ({
      value: String(group.group_number),
      label: t("requisiteForm.existingGroup", {
        number: formatNumber(group.group_number),
        count: group.items.length,
      }),
    })),
    {
      value: String(groups.length ? nextGroup : 1),
      label: groups.length
        ? t("requisiteForm.newGroup", { number: formatNumber(nextGroup) })
        : t("requisiteForm.firstGroup"),
    },
  ];

  const targetField = TARGET_FIELD[values.requisite_type];
  const targets =
    values.requisite_type === "course"
      ? (courseOptions.data ?? [])
          .filter((item) => String(item.id) !== values.course_id)
          .map((item) => ({ value: String(item.id), label: `${item.code} · ${item.title}` }))
      : (standingBands.data ?? []).map((band) => ({
          value: String(band.id),
          label: `${t(`standing.${band.level}`, { defaultValue: band.level })} · ${t(
            "standing.minCredits",
            { count: band.min_credits_passed, value: formatNumber(band.min_credits_passed) },
          )}`,
        }));
  const targetsLoading =
    values.requisite_type === "course" ? courseOptions.isPending : standingBands.isPending;

  const required = t("common:states.required");
  const errors = {
    course_id: !values.course_id ? required : null,
    target_id: !values.target_id ? required : serverFieldError(error, targetField),
    group_number: serverFieldError(error, "group_number"),
    source_reference: !values.source_reference.trim()
      ? required
      : serverFieldError(error, "source_reference"),
  };
  const show = (field, serverKey = field) =>
    touched || error?.details?.fields?.[serverKey] ? errors[field] : null;

  const set =
    (field, reset = {}) =>
    (event) =>
      setValues((v) => ({ ...v, [field]: event.target.value, ...reset }));

  const submit = (event) => {
    event.preventDefault();
    setTouched(true);
    if (!values.course_id || !values.target_id || !values.source_reference.trim()) return;
    addRequisite.mutate(
      {
        courseId: Number(values.course_id),
        requisite_type: values.requisite_type,
        [targetField]: Number(values.target_id),
        group_number: Number(values.group_number),
        source_reference: values.source_reference.trim(),
      },
      {
        onSuccess: () => {
          toast.success(
            t("toast.requisiteAdded", {
              code: fixedCourse?.code ?? detail.data?.code ?? "",
            }),
          );
          onClose();
        },
      },
    );
  };

  const knownFieldError = Object.keys(error?.details?.fields ?? {}).some((field) =>
    [targetField, "group_number", "source_reference"].includes(field),
  );
  const loadingOption = [{ value: "", label: t("common:states.loading") }];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t("requisiteForm.title")}
      description={
        fixedCourse
          ? t("requisiteForm.descriptionFor", { code: fixedCourse.code })
          : t("requisiteForm.description")
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t("common:actions.cancel")}
          </Button>
          <Button type="submit" form="requisite-form" loading={addRequisite.isPending}>
            {t("requisiteForm.submit")}
          </Button>
        </>
      }
    >
      <form id="requisite-form" noValidate onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        {!fixedCourse && (
          <>
            <Field label={t("form.bylaw")} required>
              {(props) => (
                <Select
                  {...props}
                  value={values.bylaw_id}
                  onChange={set("bylaw_id", { course_id: "", target_id: "", group_number: "1" })}
                  options={bylaws.map((bylaw) => ({
                    value: String(bylaw.bylaw_id),
                    label: t(`bylaw.long.${bylaw.bylaw_code}`, {
                      defaultValue: bylaw.bylaw_code,
                    }),
                  }))}
                />
              )}
            </Field>
            <Field label={t("requisiteForm.course")} error={show("course_id")} required>
              {(props) => (
                <Select
                  {...props}
                  value={values.course_id}
                  onChange={set("course_id", { group_number: "1" })}
                  options={
                    courseOptions.isPending
                      ? loadingOption
                      : [
                          { value: "", label: t("requisiteForm.chooseCourse") },
                          ...(courseOptions.data ?? []).map((item) => ({
                            value: String(item.id),
                            label: `${item.code} · ${item.title}`,
                          })),
                        ]
                  }
                />
              )}
            </Field>
          </>
        )}

        <Field label={t("requisiteForm.type")} required>
          {(props) => (
            <Select
              {...props}
              value={values.requisite_type}
              onChange={set("requisite_type", { target_id: "" })}
              options={TYPES.map((type) => ({ value: type, label: t(`requisiteType.${type}`) }))}
            />
          )}
        </Field>
        <Field
          label={t(`requisiteForm.target.${values.requisite_type}`)}
          hint={t("requisiteForm.sameBylaw")}
          error={show("target_id", targetField)}
          required
        >
          {(props) => (
            <Select
              {...props}
              value={values.target_id}
              onChange={set("target_id")}
              options={
                targetsLoading
                  ? loadingOption
                  : [{ value: "", label: t("requisiteForm.chooseTarget") }, ...targets]
              }
            />
          )}
        </Field>
        <Field
          label={t("requisiteForm.group")}
          hint={t("requisiteForm.groupHint")}
          error={show("group_number")}
        >
          {(props) => (
            <Select
              {...props}
              disabled={!values.course_id}
              value={values.group_number}
              onChange={set("group_number")}
              options={groupOptions}
            />
          )}
        </Field>
        <Field
          label={t("form.sourceReference")}
          hint={t("form.sourceReferenceHint")}
          error={show("source_reference")}
          required
        >
          {(props) => (
            <Input {...props} value={values.source_reference} onChange={set("source_reference")} />
          )}
        </Field>

        {error && !knownFieldError && (
          <Alert tone="danger" className="sm:col-span-2">
            {error.message}
          </Alert>
        )}
      </form>
    </Dialog>
  );
}
