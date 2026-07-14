import { useGSAP } from "@gsap/react";
import { clsx } from "clsx";
import { gsap } from "gsap";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
import { useRef } from "react";

gsap.registerPlugin(MorphSVGPlugin, useGSAP);

// Order in which the visible #morph path cycles through shapes.
// Paste the full `d` attribute for each shape from the CodePen source.
const SHAPES = [
  { id: "speech", d: "M20,1 85,1 85,66 51,98 51,66 20,66z" },
  {
    id: "lightning",
    // PASTE FULL `d` FROM CODEPEN — fetch truncated the middle.
    d: "M47.1,0.8 ... 73.3,0.8 61.9,37.2 77.1,37.2 30.7,99.4 45.8,51.9 29,51.9z",
  },
  { id: "square", d: "M50,1l49,49L50,99L1,50L50,1z" },
  {
    id: "grid",
    d: "M2 4H34.1774V35.4113H64.8226V4H97V36.1774H65.5887V66.8226H97V99H64.8226V67.5887H34.1774V99H2V66.8226H33.4113V36.1774H2V4Z",
  },
  {
    id: "bulb",
    // PASTE FULL `d` FROM CODEPEN — fetch truncated.
    d: "M51.5 19.5033 ... Z",
  },
  {
    id: "rocket",
    // PASTE FULL `d` FROM CODEPEN — fetch truncated.
    d: "M53.2635 68.6401 ... Z",
  },
  {
    id: "thumb",
    // PASTE FULL `d` FROM CODEPEN — fetch truncated.
    d: "M94 44.0172 ... Z",
  },
] as const;

const INITIAL_MORPH_D =
  "M74.6 50.2h-.2v-.4h.2a24.4 24.4 0 1 0-24.4-24.4v.2h-.4v-.2a24.4 24.4 0 1 0-24.4 24.4h.2v.4h-.2a24.4 24.4 0 1 0 24.4 24.4v-.2h.4v.2a24.4 24.4 0 1 0 24.4-24.4z";

interface MorphSVGLoopProps {
  className?: string;
  duration?: number;
  ease?: string;
  gradientFrom?: string;
  gradientTo?: string;
}

export function MorphSVGLoop({
  className,
  duration = 2,
  ease = "expo.inOut",
  gradientFrom = "rgb(255, 135, 9)",
  gradientTo = "rgb(247, 189, 248)",
}: MorphSVGLoopProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({
        repeat: -1,
        defaults: { duration, ease },
      });

      SHAPES.forEach(({ id }) => {
        tl.to("#morph", { morphSVG: `#${id}` });
      });

      // Loop back to the starting shape.
      tl.to("#morph", { morphSVG: "#morph" });
    },
    { scope: svgRef, dependencies: [duration, ease] },
  );

  return (
    <div
      className={clsx(
        "flex h-dvh w-full items-center justify-center bg-bg-primary",
        className,
      )}
    >
      <svg
        ref={svgRef}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-3/5 max-w-125 overflow-visible"
      >
        <defs>
          <linearGradient
            id="morph-grad"
            x1="0"
            y1="0"
            x2="99"
            y2="99"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0.2" stopColor={gradientFrom} />
            <stop offset="0.7" stopColor={gradientTo} />
          </linearGradient>

          {SHAPES.map(({ id, d }) => (
            <path key={id} id={id} d={d} />
          ))}
        </defs>

        <path id="morph" fill="url(#morph-grad)" d={INITIAL_MORPH_D} />
      </svg>
    </div>
  );
}
