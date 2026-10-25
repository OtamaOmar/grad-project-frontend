import { Link } from "react-router";
import { Button, Icon } from "@/components/ui";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

/** Centered full-page message used by 404 / 403 / crash screens. */
export function StatusPage({
  code,
  icon,
  title,
  body,
  actionLabel,
  actionTo,
  onRetry,
  retryLabel,
}) {
  useDocumentTitle(title);

  return (
    <section className="grid min-h-[70dvh] place-items-center px-4 py-16 text-center">
      <div className="max-w-md">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-surface-container text-primary">
          <Icon name={icon} size={28} />
        </span>
        {code && <p className="mt-5 font-mono text-label-md text-on-surface-variant">{code}</p>}
        <h1 className="mt-2 font-serif text-headline-lg font-semibold text-on-surface">{title}</h1>
        <p className="mt-3 text-body-lg text-on-surface-variant">{body}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {onRetry && (
            <Button variant="secondary" icon="refresh" onClick={onRetry}>
              {retryLabel}
            </Button>
          )}
          {actionTo && (
            <Button as={Link} to={actionTo} icon="home">
              {actionLabel}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
