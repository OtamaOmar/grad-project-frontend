import { cn } from "@/utils/cn";

export function Card({ as: Component = "section", className, children, ...props }) {
  return (
    <Component
      className={cn(
        "rounded-xl border border-outline-variant/70 bg-surface-container-lowest shadow-card",
        className,
      )}
      {...props}
    >
      {children}
    </Component>
  );
}

/** Card title row: serif title, optional subtitle, and actions on the end side. */
export function CardHeader({ title, subtitle, actions, className, titleAs: Title = "h2" }) {
  return (
    <header
      className={cn("flex flex-wrap items-start justify-between gap-3 px-5 pt-5 pb-3", className)}
    >
      <div className="min-w-0">
        <Title className="font-serif text-headline-md font-semibold text-on-surface">{title}</Title>
        {subtitle && <p className="mt-0.5 text-body-sm text-on-surface-variant">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function CardBody({ className, children }) {
  return <div className={cn("px-5 pb-5", className)}>{children}</div>;
}

export function CardFooter({ className, children }) {
  return (
    <footer
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/70 px-5 py-3 text-body-sm text-on-surface-variant",
        className,
      )}
    >
      {children}
    </footer>
  );
}
