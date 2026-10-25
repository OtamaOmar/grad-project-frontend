import { useTranslation } from "react-i18next";
import { Badge, DropdownMenu, Icon, IconButton } from "@/components/ui";
import { cn } from "@/utils/cn";
import { formatNumber } from "@/utils/format";

const TERM_ORDER = { fall: 0, spring: 1 };

/** "CSCI 101 + MATH 111 / Junior standing": same group = AND, different groups = OR. */
function usePrereqText() {
  const { t } = useTranslation("adminStudyPlans");
  return (prerequisites = []) => {
    if (!prerequisites.length) return null;
    const groups = new Map();
    for (const item of prerequisites) {
      const label =
        item.course_code ??
        (item.standing_level
          ? t(`standing.${item.standing_level}`, { defaultValue: item.standing_level })
          : item.placement_code
            ? t("placement", { code: item.placement_code })
            : null);
      if (!label) continue;
      groups.set(item.group_number, [...(groups.get(item.group_number) ?? []), label]);
    }
    return [...groups.values()].map((group) => group.join(" + ")).join(` ${t("or")} `);
  };
}

function SlotCard({ slot, onEdit, onRemove }) {
  const { t } = useTranslation(["adminStudyPlans", "common"]);
  const prereqText = usePrereqText();
  const isPool = slot.slot_kind === "elective_pool";
  const prereq = prereqText(slot.prerequisites);

  return (
    <li
      className={cn(
        "flex min-w-0 flex-col rounded-lg border bg-surface-container-lowest p-3",
        isPool ? "border-dashed border-primary/40" : "border-outline-variant/70",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone="primary">
            {t("slotN", { n: formatNumber(slot.position, { minimumIntegerDigits: 2 }) })}
          </Badge>
          {isPool && (
            <Badge tone="info" icon="call_split">
              {t("slotKind.elective_pool")}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-label-md font-semibold whitespace-nowrap text-on-surface-variant">
            {slot.credits === null
              ? t("creditsUnknown")
              : t("creditsShort", { value: formatNumber(slot.credits) })}
          </span>
          {(onEdit || onRemove) && (
            <DropdownMenu
              items={[
                { label: t("slotActions.edit"), icon: "edit", onSelect: () => onEdit(slot) },
                {
                  label: t("slotActions.remove"),
                  icon: "delete",
                  tone: "danger",
                  onSelect: () => onRemove(slot),
                },
              ]}
              trigger={({ props }) => (
                <IconButton
                  icon="more_vert"
                  size="sm"
                  label={t("slotActions.label", {
                    name: slot.course_code ?? slot.elective_pool_name,
                  })}
                  {...props}
                />
              )}
            />
          )}
        </div>
      </div>

      {isPool ? (
        <>
          <p className="mt-2 font-serif text-headline-sm font-semibold text-on-surface">
            {slot.elective_pool_name}
          </p>
          <p className="text-body-sm text-on-surface-variant">
            {t("pool.chooseFrom", {
              value: formatNumber(slot.choose_count),
              total: formatNumber(slot.pool_courses.length),
            })}
          </p>
          {slot.pool_courses.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-1">
              {slot.pool_courses.map((course) => (
                <li key={course.id}>
                  <span
                    dir="ltr"
                    title={course.title}
                    className="inline-block rounded-sm bg-surface-container-low px-1.5 py-0.5 font-mono text-label-sm text-on-surface"
                  >
                    {course.code}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      ) : (
        <>
          <p
            dir="ltr"
            className="mt-2 font-serif text-headline-md font-semibold text-on-surface rtl:text-end"
          >
            {slot.course_code}
          </p>
          <p className="text-body-sm text-on-surface-variant">{slot.course_title}</p>
        </>
      )}

      {!isPool && (
        <div className="mt-auto pt-3">
          <p className="border-t border-outline-variant/60 pt-2 text-body-sm text-on-surface-variant">
            {t("prereq")}:{" "}
            <bdi className="font-medium text-on-surface">{prereq ?? t("prereqNone")}</bdi>
          </p>
        </div>
      )}
    </li>
  );
}

function TermPanel({ term, gap, onAdd, onEdit, onRemove }) {
  const { t } = useTranslation(["adminStudyPlans", "common"]);
  const title = t("termTitle", {
    year: formatNumber(term.study_year),
    term: t(`termType.${term.term_type}`),
  });

  return (
    <section
      aria-label={title}
      className={cn(
        "flex min-w-0 flex-col rounded-xl border p-4",
        term.not_guessed
          ? "border-warning/40 bg-warning-container/30"
          : "border-outline-variant/70 bg-surface-container-low/60",
      )}
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon
            name={term.term_type === "fall" ? "eco" : "local_florist"}
            size={18}
            className="text-primary"
          />
          <h4 className="text-label-lg font-semibold text-on-surface">{title}</h4>
        </div>
        <div className="flex items-center gap-1.5">
          {term.not_guessed ? (
            <Badge tone="warning" icon="block">
              {t("notGuessed")}
            </Badge>
          ) : (
            <>
              <Badge tone="outline">
                {t("slotsCount", { value: formatNumber(term.slot_count) })}
              </Badge>
              <Badge tone="neutral">
                {t("creditsShort", { value: formatNumber(term.credits) })}
              </Badge>
            </>
          )}
          {onAdd && !term.not_guessed && (
            <IconButton
              icon="add"
              size="sm"
              label={t("addSlotTo", { term: title })}
              onClick={() => onAdd(term)}
            />
          )}
        </div>
      </header>

      {term.not_guessed ? (
        <div className="mt-3 flex flex-1 flex-col justify-center rounded-lg border-2 border-dashed border-warning/40 p-4 text-center">
          <Icon name="grid_off" size={24} className="mx-auto text-on-warning-container" />
          <p className="mt-2 text-body-md font-semibold text-on-warning-container">
            {t("notGuessedTitle")}
          </p>
          <p className="mt-1 text-body-sm text-on-surface-variant">
            {gap
              ? t("notGuessedGap", { id: formatNumber(gap.id), description: gap.description })
              : term.data_gap_id
                ? t("notGuessedGapId", { id: formatNumber(term.data_gap_id) })
                : t("notGuessedBody")}
          </p>
          {onAdd && (
            <button
              type="button"
              onClick={() => onAdd(term)}
              className="mx-auto mt-3 text-label-md font-semibold text-primary hover:underline"
            >
              {t("addVerifiedSlot")}
            </button>
          )}
        </div>
      ) : term.slots.length === 0 ? (
        <p className="mt-3 rounded-lg border border-dashed border-outline-variant p-4 text-center text-body-sm text-on-surface-variant">
          {t("termEmpty")}
        </p>
      ) : (
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {term.slots.map((slot) => (
            <SlotCard key={slot.id} slot={slot} onEdit={onEdit} onRemove={onRemove} />
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * Template detail: study years as rows, fall and spring side by side (stacked on small
 * screens). Terms whose sheet region was unreadable are shown as "not guessed".
 */
export function PlanGrid({ plan, onAdd, onEdit, onRemove }) {
  const { t } = useTranslation(["adminStudyPlans", "common"]);
  const gaps = new Map((plan.data_gaps ?? []).map((gap) => [gap.id, gap]));
  const years = [...new Set(plan.terms.map((term) => term.study_year))].sort((a, b) => a - b);

  // Slots in years 5–6 (allowed by the check) are grouped into their own terms.
  const extraTerms = [];
  for (const slot of plan.extra_slots ?? []) {
    let term = extraTerms.find(
      (row) => row.study_year === slot.study_year && row.term_type === slot.term_type,
    );
    if (!term) {
      term = {
        study_year: slot.study_year,
        term_type: slot.term_type,
        slots: [],
        slot_count: 0,
        credits: 0,
      };
      extraTerms.push(term);
    }
    term.slots.push(slot);
    term.slot_count += 1;
    term.credits += slot.credits ?? 0;
  }
  extraTerms.sort(
    (a, b) => a.study_year - b.study_year || TERM_ORDER[a.term_type] - TERM_ORDER[b.term_type],
  );

  const allYears = [...years, ...new Set(extraTerms.map((term) => term.study_year))];

  return (
    <div className="flex flex-col gap-5">
      {allYears.map((year) => {
        const terms = [
          ...plan.terms.filter((term) => term.study_year === year),
          ...extraTerms.filter((term) => term.study_year === year),
        ].sort((a, b) => TERM_ORDER[a.term_type] - TERM_ORDER[b.term_type]);
        const credits = terms.reduce((sum, term) => sum + (term.credits ?? 0), 0);
        return (
          <div key={year} className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <h3 className="font-serif text-headline-sm font-semibold text-on-surface">
                {t("yearN", { n: formatNumber(year) })}
              </h3>
              <span className="h-px flex-1 bg-outline-variant/70" aria-hidden="true" />
              <span className="text-label-md text-on-surface-variant">
                {terms.every((term) => term.not_guessed)
                  ? t("yearNotGuessed")
                  : t(
                      terms.some((term) => term.not_guessed) ? "yearCreditsPartial" : "yearCredits",
                      {
                        value: formatNumber(credits),
                      },
                    )}
              </span>
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              {terms.map((term) => (
                <TermPanel
                  key={term.term_type}
                  term={term}
                  gap={gaps.get(term.data_gap_id)}
                  onAdd={onAdd}
                  onEdit={onEdit}
                  onRemove={onRemove}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
