import { DURATION, EASE } from "./tokens";

/**
 * Popover / menu presence for AnimatePresence. Scales from its trigger (pair with an
 * origin class on the element), 150 ms in, faster out. Menus open many times a day,
 * so the motion is small: 4 px and 3 % scale, never a stagger of the items.
 */
export const popover = {
  initial: { opacity: 0, y: -4, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.15, ease: EASE.out } },
  exit: { opacity: 0, y: -2, scale: 0.98, transition: { duration: 0.1, ease: EASE.out } },
};

/** Toasts enter from the edge they live on and leave the same way (spatial consistency). */
export const toast = {
  initial: { opacity: 0, y: 16, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: EASE.out } },
  exit: { opacity: 0, scale: 0.96, transition: { duration: DURATION.micro, ease: EASE.out } },
};

/** List rows that are added or removed by the user (not by loading). */
export const listItem = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: DURATION.small, ease: EASE.out } },
  exit: { opacity: 0, transition: { duration: 0.14, ease: EASE.out } },
};
