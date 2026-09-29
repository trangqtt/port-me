import { useLenis } from "lenis/react";
import Snap from "lenis/snap";
import { useEffect } from "react";

interface UseLenisSnapOptions {
  type?: "mandatory" | "proximity" | "lock";
  duration?: number;
}

/** Snaps scroll to each matched element (e.g. every top-level `<section>`) using Lenis's own snap module and easing. Desktop only. A `data-snap-steps="n"` element taller than the viewport also gets n-1 extra points one viewport apart, so a sticky stage can be scrolled through without the mandatory snap throwing the page past it. */
export function useLenisSnap(
  selector: string,
  { type = "mandatory", duration = 1.2 }: UseLenisSnapOptions = {},
) {
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!window.matchMedia("(min-width: 1024px)").matches) return;

    const snap = new Snap(lenis, {
      type,
      duration,
      // easeOutCubic — matches Lenis's own default deceleration feel.
      easing: (t) => 1 - Math.pow(1 - t, 3),
    });
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>(selector),
    );
    const removeElements = elements.map((element) =>
      snap.addElement(element, { align: ["start"] }),
    );

    // Raw points are absolute scroll values, so they are re-registered whenever the document changes height.
    const stepped = elements.filter((element) => element.dataset.snapSteps);
    let removeSteps: (() => void)[] = [];
    const registerSteps = () => {
      removeSteps.forEach((remove) => remove());
      removeSteps = [];
      for (const element of stepped) {
        const steps = Number(element.dataset.snapSteps) || 0;
        const top = element.getBoundingClientRect().top + window.scrollY;
        for (let i = 1; i < steps; i++) {
          removeSteps.push(snap.add(top + i * window.innerHeight));
        }
      }
    };
    registerSteps();
    const resizeObserver = new ResizeObserver(registerSteps);
    resizeObserver.observe(document.body);
    window.addEventListener("resize", registerSteps);

    return () => {
      window.removeEventListener("resize", registerSteps);
      resizeObserver.disconnect();
      removeSteps.forEach((remove) => remove());
      removeElements.forEach((remove) => remove());
      snap.destroy();
    };
  }, [lenis, selector, type, duration]);
}
