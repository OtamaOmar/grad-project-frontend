import { Fragment } from "react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { cn } from "@/utils/cn";

/**
 * Page title block from the designs: breadcrumb eyebrow, serif title, description,
 * and actions on the end side. Also sets the browser tab title.
 */
export function PageHeader({ eyebrow = [], title, description, actions, meta, className }) {
  useDocumentTitle(title);

  return (
    <header
      className={cn("flex flex-col gap-4 md:flex-row md:items-end md:justify-between", className)}
    >
      <div className="min-w-0">
        {eyebrow.length > 0 && (
          <p className="mb-1.5 flex flex-wrap items-center gap-x-2 text-label-sm font-semibold tracking-wider text-on-surface-variant uppercase">
            {eyebrow.map((crumb, i) => (
              <Fragment key={i}>
                {i > 0 && <span aria-hidden="true">/</span>}
                <span>{crumb}</span>
              </Fragment>
            ))}
          </p>
        )}
        <h1 className="font-serif text-headline-lg font-semibold text-on-surface sm:text-display">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-3xl text-body-lg text-on-surface-variant">{description}</p>
        )}
        {meta && <div className="mt-3 flex flex-wrap items-center gap-2">{meta}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 md:shrink-0">{actions}</div>}
    </header>
  );
}
