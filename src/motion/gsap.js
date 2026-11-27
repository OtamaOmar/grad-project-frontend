import { gsap } from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

/**
 * GSAP entry point. Import gsap from here so plugins are registered exactly once.
 * GSAP is only pulled into the public pages (landing, sign-in, password reset) and
 * the pages that use useScrollReveal, which are code-split, so the shell stays light.
 */
gsap.registerPlugin(useGSAP, ScrollTrigger, DrawSVGPlugin);

gsap.defaults({ ease: "expo.out", duration: 0.6 });

export { gsap, ScrollTrigger, useGSAP };

/** Query used by every gsap.matchMedia() block in the app. */
export const MEDIA = {
  motionOk: "(prefers-reduced-motion: no-preference)",
  reduce: "(prefers-reduced-motion: reduce)",
  desktop: "(min-width: 1024px)",
  hover: "(hover: hover) and (pointer: fine)",
};

/**
 * Reveals elements matching `selector` inside `scope` as they scroll into view, in batches
 * (one stagger per group that enters together, not one per element). Elements already on
 * screen at load reveal at once. Reduced motion: nothing is hidden or moved.
 *
 * Use sparingly: long, read-once pages (landing, help), never on tables or forms.
 */
export function useScrollReveal(scope, selector = "[data-reveal]", deps = []) {
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MEDIA.motionOk, () => {
        const targets = gsap.utils.toArray(selector, scope.current);
        if (!targets.length) return;
        gsap.set(targets, { autoAlpha: 0, y: 18 });
        ScrollTrigger.batch(targets, {
          start: "top 92%",
          once: true,
          interval: 0.08,
          batchMax: 6,
          onEnter: (batch) =>
            gsap.to(batch, {
              autoAlpha: 1,
              y: 0,
              duration: 0.6,
              ease: "expo.out",
              // Shrinking gaps read as a wave, equal gaps as a metronome.
              stagger: { each: 0.07, ease: "power1.in" },
              overwrite: true,
              clearProps: "transform",
            }),
        });
      });
      return () => mm.revert();
    },
    { scope, dependencies: deps, revertOnUpdate: true },
  );
}
