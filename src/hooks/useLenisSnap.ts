import { useLenis } from "lenis/react";
import Snap from "lenis/snap";
import { useEffect } from "react";

interface UseLenisSnapOptions {
  type?: "mandatory" | "proximity" | "lock";
  duration?: number;
}

/** Snaps scroll to each matched element (e.g. every top-level `<section>`) using Lenis's own snap module and easing. Desktop only. */
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

    return () => {
      removeElements.forEach((remove) => remove());
      snap.destroy();
    };
  }, [lenis, selector, type, duration]);
}
