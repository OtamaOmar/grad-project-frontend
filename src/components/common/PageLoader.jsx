import { useTranslation } from "react-i18next";
import { Skeleton } from "@/components/ui";

// The shape of a typical page while it loads: heading, four stat cards and a table.
// Screen readers hear "Loading…"; everyone else sees the layout fill in.
function PageSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-8 w-72 max-w-full" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="flex flex-col gap-3 rounded-xl border border-outline-variant/60 p-5"
          >
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3 rounded-xl border border-outline-variant/60 p-5">
        <Skeleton className="h-5 w-48" />
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}

// Loading placeholder for a page (lazy route, data) or, with fullScreen, for the whole
// app while the session is checked: then the top bar and menu are drawn too.
export function PageLoader({ fullScreen = false }) {
  const { t } = useTranslation();
  const label = <span className="sr-only">{t("states.loading")}</span>;

  if (!fullScreen) {
    return (
      <div role="status" aria-live="polite" aria-busy="true">
        {label}
        <PageSkeleton />
      </div>
    );
  }

  return (
    <div role="status" aria-live="polite" aria-busy="true" className="min-h-dvh bg-surface">
      {label}
      <div className="border-b border-outline-variant/70 px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-[90rem] items-center justify-between gap-4">
          <Skeleton className="h-6 w-64 max-w-[60%]" />
          <div className="flex items-center gap-3">
            <Skeleton className="size-8 rounded-full" />
            <Skeleton className="hidden h-8 w-28 sm:block" />
          </div>
        </div>
        <div className="mx-auto mt-3 hidden max-w-[90rem] gap-5 lg:flex">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-4 w-16" />
          ))}
        </div>
      </div>
      <div className="px-4 py-6 sm:px-6 lg:py-8">
        <div className="mx-auto max-w-[90rem]">
          <PageSkeleton />
        </div>
      </div>
    </div>
  );
}
