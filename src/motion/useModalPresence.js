import { memo, useContext, useEffect, useState } from "react";
import { ModalExitContext } from "./modalExitContext";
import { animate } from "motion/mini";
import { DURATION, EASE, prefersReducedMotion } from "./tokens";

// Enter/exit keyframes per surface. Modals stay centred (no origin shift); drawers slide
// from their own edge. Exits are shorter than entrances: the user has already decided.
function frames(kind, side) {
  if (kind === "drawer") {
    const rtl = document.documentElement.dir === "rtl";
    const fromRight = (side === "end") !== rtl;
    const off = `translateX(${fromRight ? "100%" : "-100%"})`;
    return {
      from: { transform: off, opacity: 1 },
      to: { transform: "translateX(0%)", opacity: 1 },
      exit: { transform: off, opacity: 1 },
      enter: { duration: DURATION.drawer, ease: EASE.drawer },
      leave: { duration: 0.24, ease: EASE.drawer },
    };
  }
  return {
    from: { transform: "translateY(8px) scale(0.97)", opacity: 0 },
    to: { transform: "translateY(0px) scale(1)", opacity: 1 },
    exit: { transform: "translateY(4px) scale(0.98)", opacity: 0 },
    enter: { duration: DURATION.modal, ease: EASE.out },
    leave: { duration: 0.16, ease: EASE.out },
  };
}

/**
 * Drives a native <dialog> through open → enter animation → exit animation → close().
 * Escape closes natively and instantly (keyboard actions should not animate);
 * clicks on close / backdrop / Cancel animate out first.
 *
 * Returns `rendered` (keep content mounted) and `closing` (exit in progress).
 */
export function useModalPresence(ref, open, { kind = "modal", side = "end" } = {}) {
  const onExited = useContext(ModalExitContext);
  const [closing, setClosing] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    setClosing(!open);
  }

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const reduce = prefersReducedMotion();
    const f = frames(kind, side);

    // No Web Animations API (old browsers, jsdom): open and close without motion.
    if (typeof dialog.animate !== "function") {
      if (open && !dialog.open) dialog.showModal();
      if (!open && closing) {
        if (dialog.open) dialog.close();
        queueMicrotask(() => {
          setClosing(false);
          onExited?.();
        });
      }
      return;
    }

    if (open) {
      if (!dialog.open) {
        Object.assign(dialog.style, reduce ? { opacity: 0 } : f.from);
        dialog.showModal();
      }
      const controls = animate(dialog, reduce ? { opacity: 1, transform: "none" } : f.to, {
        ...f.enter,
        duration: reduce ? 0.15 : f.enter.duration,
      });
      return () => controls.stop();
    }

    if (!closing) return;
    // Already closed natively (Escape): finish at once.
    const duration = dialog.open && !reduce ? f.leave.duration : dialog.open ? 0.1 : 0;
    const controls = animate(dialog, reduce ? { opacity: 0 } : f.exit, { ...f.leave, duration });
    let cancelled = false;
    controls.then(() => {
      if (cancelled) return;
      if (dialog.open) dialog.close();
      setClosing(false);
      onExited?.();
    });
    return () => {
      cancelled = true;
      controls.stop();
    };
  }, [ref, open, closing, kind, side, onExited]);

  return { rendered: open || closing, closing };
}

/**
 * Renders its children, but stops re-rendering them while `open` is false, so a closing
 * dialog keeps showing what it showed when it was open (title, form, data) instead of
 * the cleared state the parent has already moved to.
 */
export const Frozen = memo(
  function Frozen({ children }) {
    return children;
  },
  (_prev, next) => !next.open,
);
