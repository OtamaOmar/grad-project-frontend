import { cn } from "@/utils/cn";
import { Icon } from "./Icon";

export function EmptyState({ icon = "inbox", title, description, action, className }) {
  return (
    <div className={cn("flex flex-col items-center px-6 py-12 text-center", className)}>
      <span className="icon-pop grid size-12 place-items-center rounded-full bg-surface-container text-on-surface-variant">
        <Icon name={icon} size={24} />
      </span>
      <p className="mt-4 font-serif text-headline-sm font-semibold text-on-surface">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-body-md text-on-surface-variant">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
