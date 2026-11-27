import { gsap, MEDIA, useGSAP } from "./gsap";

/**
 * Sign-in / password-reset intro, one GSAP timeline per page visit:
 *   card settles in (lead) → brand panel lines rise → accent rule draws → features slide
 *   in from the reading-start side → form panel fields rise in a short overlap.
 * Marks used: data-intro = card | brand | divider | feature | panel.
 * Everything clears its inline transforms afterwards, so focus rings and layout are untouched.
 */
export function useAuthIntro(scope) {
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MEDIA.motionOk, () => {
        const rtl = document.documentElement.dir === "rtl";
        const q = gsap.utils.selector(scope);
        const panel = q("[data-intro=panel] > div:not(:has(form)), [data-intro=panel] form > *");
        const tl = gsap.timeline({
          defaults: { ease: "expo.out", duration: 0.7, clearProps: "transform,opacity,visibility" },
        });
        tl.from(q("[data-intro=card]"), { autoAlpha: 0, y: 20, scale: 0.985, duration: 0.8 })
          .from(q("[data-intro=brand] > *"), { autoAlpha: 0, y: 12, stagger: 0.08 }, 0.15)
          .from(
            q("[data-intro=divider]"),
            { scaleX: 0, transformOrigin: rtl ? "right center" : "left center", duration: 0.8 },
            0.35,
          )
          .from(
            q("[data-intro=feature]"),
            { autoAlpha: 0, x: rtl ? 14 : -14, stagger: { each: 0.08, ease: "power1.in" } },
            0.4,
          )
          .from(panel, { autoAlpha: 0, y: 10, stagger: { amount: 0.3, ease: "power1.in" } }, 0.2);
      });
      return () => mm.revert();
    },
    { scope },
  );
}
