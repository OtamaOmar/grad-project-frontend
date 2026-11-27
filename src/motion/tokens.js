/**
 * One motion vocabulary for the app. CSS mirrors these as --ease-* / --dur-* in index.css.
 *
 * Rules of thumb (Emil Kowalski's framework):
 * - Entering or exiting: ease-out. Moving on screen: ease-in-out. Never ease-in.
 * - Product UI stays under 300 ms; modals and drawers may take up to ~400 ms.
 * - Things used many times a day (menus, tabs, keyboard actions) animate least.
 */

// Cubic-bezier arrays for Motion; strings for CSS / WAAPI.
export const EASE = {
  out: [0.23, 1, 0.32, 1],
  inOut: [0.77, 0, 0.175, 1],
  drawer: [0.32, 0.72, 0, 1],
};

export const EASE_CSS = {
  out: "cubic-bezier(0.23, 1, 0.32, 1)",
  inOut: "cubic-bezier(0.77, 0, 0.175, 1)",
  drawer: "cubic-bezier(0.32, 0.72, 0, 1)",
};

// Seconds (Motion / GSAP).
export const DURATION = {
  press: 0.16,
  micro: 0.18,
  small: 0.24,
  modal: 0.28,
  drawer: 0.36,
  entrance: 0.5,
  hero: 0.8,
};

// Springs (Apple-style config): used where motion follows the user or retargets often.
export const SPRING = {
  snappy: { type: "spring", duration: 0.35, bounce: 0.12 },
  indicator: { type: "spring", duration: 0.4, bounce: 0.15 },
};

/** Reads the OS "reduce motion" setting at call time (for imperative animations). */
export function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
  );
}
