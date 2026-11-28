/**
 * ACOPS brand mark: a stepped path from a start dot to a goal ring.
 * Draws in currentColor, so set the colour with a text-* class.
 */
export function AcopsMark({ className = "", title }) {
  return (
    <svg
      viewBox="0 0 104 104"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <circle cx="12" cy="88" r="11" fill="currentColor" stroke="none" />
      <path d="M12 88H49V57" strokeWidth="9" />
      <circle cx="48" cy="56" r="10" fill="currentColor" stroke="none" />
      <path d="M48 56H84V37" strokeWidth="9" />
      <circle cx="85.5" cy="22" r="13.5" strokeWidth="8" />
    </svg>
  );
}
