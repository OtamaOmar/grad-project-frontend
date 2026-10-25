import { cn } from "@/utils/cn";
import { Icon } from "./Icon";
import { Spinner } from "./Spinner";

const VARIANTS = {
  primary: "bg-primary text-on-primary hover:bg-primary/90 shadow-card",
  tonal: "bg-primary-fixed text-on-primary-fixed hover:bg-primary-fixed/80",
  secondary:
    "border border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-low",
  ghost: "text-primary hover:bg-surface-container",
  danger: "bg-error text-on-error hover:bg-error/90",
};

// Icons that point somewhere are mirrored in right-to-left layouts.
const DIRECTIONAL =
  /^(arrow_back|arrow_forward|chevron_left|chevron_right|east|west|logout|login|open_in_new)$/;

const SIZES = {
  sm: "h-8 gap-1.5 px-3 text-label-md",
  md: "h-10 gap-2 px-4 text-label-lg",
};

/**
 * Button. Pass `as={Link}` (plus `to`) to render a router link styled as a button.
 * `icon` / `iconEnd` are Material Symbols names.
 */
export function Button({
  as: Component = "button",
  variant = "primary",
  size = "md",
  icon,
  iconEnd,
  loading = false,
  disabled,
  className,
  children,
  ...props
}) {
  const isButton = Component === "button";
  return (
    <Component
      type={isButton ? (props.type ?? "button") : undefined}
      disabled={isButton ? disabled || loading : undefined}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-md font-semibold whitespace-nowrap transition-colors",
        "disabled:pointer-events-none disabled:opacity-50",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {loading ? (
        <Spinner size={size === "sm" ? 14 : 16} />
      ) : (
        icon && <Icon name={icon} size={18} flipRtl={DIRECTIONAL.test(icon)} />
      )}
      {children}
      {iconEnd && <Icon name={iconEnd} size={18} flipRtl={DIRECTIONAL.test(iconEnd)} />}
    </Component>
  );
}

/** Square icon-only button. `label` is required for screen readers. */
export function IconButton({ icon, label, size = "md", className, filled, ...props }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-md text-on-surface-variant transition-colors",
        "hover:bg-surface-container-high hover:text-on-surface disabled:opacity-50",
        size === "sm" ? "size-8" : "size-10",
        className,
      )}
      {...props}
    >
      <Icon name={icon} size={size === "sm" ? 18 : 22} filled={filled} />
    </button>
  );
}
