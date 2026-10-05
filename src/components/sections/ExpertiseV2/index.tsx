import { Suspense, lazy, useCallback, useMemo, useRef, useState } from "react";
import { profile } from "../../../data/profile";
import { works3d, type Work3D } from "../../../data/works3d";
import { cn } from "../../../lib/utils";
import type { CylinderMode } from "./cylinderWorld";

// Three.js only loads when this section mounts, so the main bundle does not carry it.
const CylinderCanvas = lazy(() => import("./CylinderCanvas"));

// What this section borrows from k95.it: the glass pair behind the switch, and its 14px uppercase chrome at .5px
// tracking. The stage keeps this site's own dark background and its own fonts — k95's electric blue is not carried over.
const GLASS = "rgba(28, 28, 28, 0.1)";
const GLASS_BORDER = "hsla(0, 0%, 100%, 0.2)";
// k95's own switch curve and its pill geometry: a 5px track inset with a 4px gap between the two halves.
const PILL_EASE = "transform 420ms cubic-bezier(0.22, 1, 0.36, 1)";

const MODES: readonly { id: CylinderMode; label: string }[] = [
  { id: "rings", label: "Rings" },
  { id: "spiral", label: "Spiral" },
];

// Figma 1:417 "Work", restaged on k95.it's home UI: a full-bleed canvas of covers with the chrome floating over it —
// the Rings/Spiral switch centred at the top, and a baseline row at the bottom carrying the active cover's label and
// the "n / N selected works" count. The section is three and a half viewports tall with a sticky stage that pins for
// the first two and a half: scrolling carries the cylinder's rows past and spins it as it goes, and the last stretch
// fades it away so the stage only scrolls off an empty frame.
export function ExpertiseV2() {
  const sectionRef = useRef<HTMLElement>(null);
  const [mode, setMode] = useState<CylinderMode>("rings");
  const [hovered, setHovered] = useState<Work3D | null>(null);
  const [front, setFront] = useState<Work3D | null>(null);
  const [revealed, setRevealed] = useState(false);

  // The pointer wins; otherwise the label follows whichever cover is nearest the camera, as k95's does.
  const active = hovered ?? front ?? works3d[0];
  const position = useMemo(() => works3d.indexOf(active) + 1, [active]);

  const open = useCallback((work: Work3D) => {
    window.location.assign(work.href);
  }, []);

  return (
    <section
      ref={sectionRef}
      id="expertise-v2"
      aria-labelledby="expertise-v2-title"
      data-snap-steps="3"
      className="relative h-[350dvh] w-full bg-primary"
    >
      <div className="sticky top-0 h-dvh w-full overflow-hidden">
        <Suspense fallback={null}>
          <CylinderCanvas
            projects={works3d}
            triggerRef={sectionRef}
            mode={mode}
            onHover={setHovered}
            onFront={setFront}
            onOpen={open}
            onReady={() => setRevealed(true)}
          />
        </Suspense>

        {/* The layout switch: a glass track with a sliding pill, centred 31px from the top of the stage. */}
        <div
          className={cn(
            "absolute left-1/2 top-[31px] z-20 flex -translate-x-1/2 gap-[4px] rounded-full border p-[5px] backdrop-blur-md",
            revealed ? "opacity-100 delay-150 duration-700" : "pointer-events-none opacity-0 duration-[250ms]",
            "transition-opacity ease-out",
          )}
          style={{ backgroundColor: GLASS, borderColor: GLASS_BORDER }}
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute bottom-[5px] left-[5px] top-[5px] w-[calc(50%-7px)] rounded-full bg-white/[0.12] motion-reduce:transition-none"
            style={{
              transition: PILL_EASE,
              transform: mode === "spiral" ? "translateX(calc(100% + 4px))" : "translateX(0)",
            }}
          />
          {MODES.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={mode === item.id}
              onClick={() => setMode(item.id)}
              className={cn(
                "relative z-[1] flex-1 cursor-pointer rounded-full bg-transparent px-4 py-[13px] text-[14px] uppercase leading-none tracking-[0.5px] transition-colors duration-200",
                mode === item.id ? "text-white" : "text-white/55",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* k95's home footer row: the active cover on the left, the count on the right, sharing one baseline. */}
        <div
          className={cn(
            "pointer-events-none absolute inset-x-[30px] bottom-[30px] z-20 flex items-baseline justify-between gap-6",
            "text-[14px] uppercase leading-[1.2] tracking-[0.5px] text-white",
            "transition-opacity duration-700 ease-out motion-reduce:transition-none",
            "md:inset-x-[40px] md:bottom-[40px] lg:inset-x-[58px] lg:bottom-[58px]",
            revealed ? "opacity-100 delay-150" : "opacity-0",
          )}
        >
          <h2 id="expertise-v2-title" className="font-display font-normal">
            {active.title} — {active.category}
          </h2>
          <p className="shrink-0 text-white/55">
            <span className="text-white">
              {position} / {works3d.length}
            </span>{" "}
            selected works
          </p>
        </div>
      </div>

      {/* Crawlable and focusable copy of the cards, since the canvas exposes nothing. */}
      <ul className="sr-only">
        {works3d.map((work) => (
          <li key={work.title}>
            <a href={work.href}>
              {work.title} — {work.category}
            </a>
          </li>
        ))}
      </ul>
      <span className="sr-only">{profile.name}</span>
    </section>
  );
}
