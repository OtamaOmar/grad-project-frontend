import { useId } from "react";
import { cn } from "@/utils/cn";
import { Icon } from "./Icon";

const CONTROL =
  "w-full rounded-md border border-outline-variant bg-surface-container-lowest text-body-md text-on-surface " +
  "placeholder:text-on-surface-variant/70 transition-colors hover:border-outline " +
  "focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 " +
  "disabled:cursor-not-allowed disabled:opacity-60 aria-[invalid=true]:border-error";

/**
 * Label + control + hint/error, wired up for screen readers.
 * children is a render function receiving the props to spread on the control.
 */
export function Field({ label, hint, error, required, className, children }) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={id} className="text-label-md font-semibold text-on-surface">
          {label}
          {required && (
            <span aria-hidden="true" className="ms-0.5 text-error">
              *
            </span>
          )}
        </label>
      )}
      {children({
        id,
        required,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": [hintId, errorId].filter(Boolean).join(" ") || undefined,
      })}
      {hint && !error && (
        <p id={hintId} className="text-body-sm text-on-surface-variant">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="flex items-center gap-1 text-body-sm text-error">
          <Icon name="error" size={16} />
          {error}
        </p>
      )}
    </div>
  );
}

export function Input({ icon, className, ...props }) {
  if (!icon) return <input className={cn(CONTROL, "h-10 px-3", className)} {...props} />;
  return (
    <div className="relative">
      <Icon
        name={icon}
        size={20}
        className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
      />
      <input className={cn(CONTROL, "h-10 ps-10 pe-3", className)} {...props} />
    </div>
  );
}

export function SearchInput({ className, ...props }) {
  return <Input type="search" icon="search" className={className} {...props} />;
}

/** Native select. `options` is [{ value, label }]. */
export function Select({ options, className, ...props }) {
  return (
    <div className="relative">
      <select className={cn(CONTROL, "h-10 appearance-none ps-3 pe-9", className)} {...props}>
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
      <Icon
        name="expand_more"
        size={20}
        className="pointer-events-none absolute end-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant"
      />
    </div>
  );
}

export function Textarea({ className, rows = 4, ...props }) {
  return <textarea rows={rows} className={cn(CONTROL, "px-3 py-2", className)} {...props} />;
}

export function Checkbox({ label, className, ...props }) {
  return (
    <label className={cn("inline-flex cursor-pointer items-center gap-2 text-body-md", className)}>
      <input
        type="checkbox"
        className="size-4 rounded-sm accent-[var(--color-primary)]"
        {...props}
      />
      {label}
    </label>
  );
}

/** Toggle switch built on a checkbox (keeps native keyboard + form behavior). */
export function Switch({ label, checked, onChange, disabled, className }) {
  return (
    <label
      className={cn(
        "inline-flex cursor-pointer items-center gap-3 text-body-md",
        disabled && "cursor-not-allowed opacity-60",
        className,
      )}
    >
      <input
        type="checkbox"
        role="switch"
        className="peer sr-only"
        checked={checked}
        onChange={(event) => onChange?.(event.target.checked)}
        disabled={disabled}
      />
      <span
        aria-hidden="true"
        className={cn(
          "relative h-6 w-10 rounded-full bg-surface-container-highest transition-colors",
          "peer-checked:bg-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary",
          "after:absolute after:top-1 after:start-1 after:size-4 after:rounded-full after:bg-surface-container-lowest after:transition-transform",
          "peer-checked:after:translate-x-4 rtl:peer-checked:after:-translate-x-4",
        )}
      />
      {label}
    </label>
  );
}
