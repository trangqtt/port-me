import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import { profile } from "../../../data/profile";
import { works3d, type Work3D } from "../../../data/works3d";

// Three.js only loads when this section mounts, so the main bundle does not carry it.
const CylinderCanvas = lazy(() => import("./CylinderCanvas"));

// Figma 1:417 "Work" copy over the helix from 424:2388. The section is three and a half viewports tall with a sticky stage that pins for the first two and a half: the helix rises into view over the first two viewports of scroll and flies out of the top over the next half, so the stage only scrolls away once every card has gone; the copy follows whichever card is under the pointer.
export function ExpertiseV2() {
  const sectionRef = useRef<HTMLElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<Work3D | null>(null);
  const [bottomInset, setBottomInset] = useState(0);

  // Below lg the copy sits under the bowl, so its height plus the 20px gutter is handed to the scene, which lifts the platform above it. At lg the copy is off to the right and needs no room.
  useEffect(() => {
    const copy = copyRef.current;
    if (!copy) return;
    const desktop = window.matchMedia("(min-width: 1024px)");
    const measure = () => setBottomInset(desktop.matches ? 0 : copy.offsetHeight + 20);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(copy);
    desktop.addEventListener("change", measure);
    return () => {
      observer.disconnect();
      desktop.removeEventListener("change", measure);
    };
  }, []);
  const active = hovered ?? works3d[0];

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
          <CylinderCanvas projects={works3d} triggerRef={sectionRef} onHover={setHovered} onOpen={open} bottomInset={bottomInset} />
        </Suspense>

        {/* Eyebrow and the active study's name, top left as in the frame. */}
        <header className="pointer-events-none absolute left-5 top-[14vh] z-20 flex flex-col gap-4 sm:left-8 lg:left-[4.48vw] lg:top-[16vh] lg:gap-8">
          <p className="flex items-center gap-5 font-accent text-sm uppercase leading-[1.2] text-primary/70 lg:gap-[21px] lg:text-base">
            <span aria-hidden="true">[→]</span>
            <span>Featured case studies</span>
          </p>
          <h2
            id="expertise-v2-title"
            aria-live="polite"
            className="font-display text-[32px] leading-none text-primary sm:text-[40px] lg:text-[52px]"
          >
            {active.title}
          </h2>
        </header>

        {/* Role and description: 20px off the bottom under the bowl on the phone, bottom right beside it from lg. */}
        <div
          ref={copyRef}
          className="pointer-events-none absolute inset-x-5 bottom-5 z-20 flex flex-col items-start gap-6 sm:inset-x-8 lg:left-auto lg:right-[4.48vw] lg:bottom-[6vh] lg:w-[427px]"
        >
          <div className="flex flex-col gap-4 font-accent text-sm uppercase leading-[1.2] lg:gap-[27px] lg:text-base">
            <p className="text-primary">[ {active.role} ]</p>
            <p className="text-primary/70">{active.description}</p>
          </div>
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
