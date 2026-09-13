import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { useCallback, useRef, useState } from "react";
import { skills } from "../../../data/skills";
import { cn } from "../../../lib/utils";

gsap.registerPlugin(useGSAP);

const FEATURED_SKILL_INDEX = 3;

interface QuickSetters {
  x: ReturnType<typeof gsap.quickTo>;
  y: ReturnType<typeof gsap.quickTo>;
}

// Per-row cursor-follow preview, one image per skill (its own `url`).
// Follows GreenSock's "show cursor image on hover" pattern:
// https://codepen.io/GreenSock/pen/PwqrzeG
export function Skills() {
  const [activeIndex, setActiveIndex] = useState(FEATURED_SKILL_INDEX);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRefs = useRef<(HTMLImageElement | null)[]>([]);
  const quickSettersRef = useRef<(QuickSetters | null)[]>([]);
  const fadeTweensRef = useRef<(gsap.core.Tween | null)[]>([]);
  const followedIndexRef = useRef<number | null>(null);
  const firstMoveRef = useRef(true);
  const pendingPointRef = useRef<{ clientX: number; clientY: number } | null>(
    null,
  );
  const rafIdRef = useRef<number | null>(null);

  const align = useCallback((point: { clientX: number; clientY: number }) => {
    const index = followedIndexRef.current;
    if (index === null) return;
    const quickTo = quickSettersRef.current[index];
    if (!quickTo) return;
    if (firstMoveRef.current) {
      quickTo.x(point.clientX, point.clientX);
      quickTo.y(point.clientY, point.clientY);
      firstMoveRef.current = false;
    } else {
      quickTo.x(point.clientX);
      quickTo.y(point.clientY);
    }
  }, []);

  // Coalesces native pointermove events to one align() per animation frame.
  const flushAlign = useCallback(() => {
    rafIdRef.current = null;
    if (pendingPointRef.current) align(pendingPointRef.current);
  }, [align]);

  // Stable identity: added/removed as the same document listener reference.
  const onDocumentPointerMove = useCallback(
    (event: PointerEvent) => {
      pendingPointRef.current = {
        clientX: event.clientX,
        clientY: event.clientY,
      };
      if (rafIdRef.current === null) {
        rafIdRef.current = window.requestAnimationFrame(flushAlign);
      }
    },
    [flushAlign],
  );

  const stopDocumentPointerMove = useCallback(() => {
    document.removeEventListener("pointermove", onDocumentPointerMove);
    if (rafIdRef.current !== null) {
      window.cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, [onDocumentPointerMove]);

  const { contextSafe } = useGSAP(
    () => {
      skills.forEach((_, index) => {
        const image = imageRefs.current[index];
        if (!image) return;

        gsap.set(image, { xPercent: -50, yPercent: -50, autoAlpha: 0 });
        quickSettersRef.current[index] = {
          x: gsap.quickTo(image, "x", { duration: 0.4, ease: "power3" }),
          y: gsap.quickTo(image, "y", { duration: 0.4, ease: "power3" }),
        };
        fadeTweensRef.current[index] = gsap.to(image, {
          autoAlpha: 1,
          ease: "none",
          duration: 0.1,
          paused: true,
        });
      });

      return () => {
        stopDocumentPointerMove();
      };
    },
    { scope: containerRef },
  );

  const canFollowPointer = () =>
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  const enterPreview = contextSafe(
    (index: number, event: React.PointerEvent) => {
      if (!canFollowPointer()) return;
      firstMoveRef.current = true;
      if (followedIndexRef.current !== index) {
        fadeTweensRef.current[followedIndexRef.current ?? -1]?.reverse();
        followedIndexRef.current = index;
        document.addEventListener("pointermove", onDocumentPointerMove);
      }
      fadeTweensRef.current[index]?.play();
      align(event);
    },
  );

  const leavePreview = contextSafe((index: number) => {
    fadeTweensRef.current[index]?.reverse();
    if (followedIndexRef.current === index) {
      followedIndexRef.current = null;
      stopDocumentPointerMove();
    }
  });

  return (
    <section
      id="skills"
      aria-labelledby="skills-title"
      className="relative min-h-dvh w-full overflow-hidden bg-primary px-5 py-16 sm:px-8 lg:px-[4.48vw] lg:pb-20 lg:pt-[17vh]"
    >
      <header className="flex flex-col gap-1 lg:grid lg:grid-cols-4 lg:items-end">
        <p className="font-accent text-sm uppercase leading-[1.2] text-primary/50 lg:text-base">
          [My Skills]
        </p>
        <h2
          id="skills-title"
          className="font-display text-[26px] font-medium leading-[1.2] text-primary lg:col-span-2 lg:pl-12 lg:text-[52px] lg:font-normal lg:leading-none"
        >
          Skills
        </h2>
      </header>

      <div ref={containerRef} className="relative mt-4 lg:mt-17">
        <ul className="relative z-10">
          {skills.map((skill, index) => {
            const isActive = index === activeIndex;
            const number = String(index + 1).padStart(2, "0");

            return (
              <li key={skill.name}>
                <button
                  type="button"
                  onMouseEnter={() => setActiveIndex(index)}
                  onFocus={() => setActiveIndex(index)}
                  onPointerEnter={(event) => enterPreview(index, event)}
                  onPointerMove={(event) => enterPreview(index, event)}
                  onPointerLeave={() => leavePreview(index)}
                  onBlur={() => leavePreview(index)}
                  className={cn(
                    "grid min-h-23 w-full grid-cols-[minmax(0,1fr)_60px] items-center gap-4 border-b border-line py-4 text-left font-accent uppercase transition-colors duration-300 focus-visible:-outline-offset-2 focus-visible:outline-2 focus-visible:outline-accent lg:min-h-16 lg:grid-cols-[6.6rem_minmax(12rem,1fr)_7rem_minmax(20rem,1fr)] lg:gap-0 lg:px-0 lg:py-6 lg:text-base",
                    isActive
                      ? "lg:bg-white lg:text-[#0d0d0d] lg:px-2"
                      : "text-primary",
                  )}
                >
                  <span className="flex min-w-0 flex-col gap-2 lg:contents">
                    <span
                      className={cn(
                        "text-xs leading-[1.2] text-primary/70 lg:text-base lg:leading-none",
                        isActive && "lg:text-[#0d0d0d]/60",
                      )}
                    >
                      [{number}]
                    </span>
                    <span className="text-sm leading-none lg:text-base">
                      {skill.name}
                    </span>
                    <span className="text-sm leading-[1.2] lg:col-start-4 lg:row-start-1 lg:text-base lg:leading-none">
                      {skill.description}
                    </span>
                  </span>

                  <span
                    className={cn(
                      "hidden leading-none text-primary/70 lg:col-start-3 lg:row-start-1 lg:block",
                      isActive && "lg:text-[#0d0d0d]/60",
                    )}
                  >
                    [{skill.descriptionLabel}]
                  </span>

                  <img
                    src={skill.url}
                    alt=""
                    aria-hidden="true"
                    width={60}
                    height={60}
                    loading="lazy"
                    decoding="async"
                    className="pointer-events-none size-15 justify-self-end lg:hidden"
                  />
                </button>
                <img
                  ref={(node) => {
                    imageRefs.current[index] = node;
                  }}
                  src={skill.url}
                  alt=""
                  aria-hidden="true"
                  width={200}
                  height={200}
                  loading="lazy"
                  decoding="async"
                  className="pointer-events-none fixed left-0 top-0 z-30 hidden size-50 object-contain opacity-0 lg:block"
                />
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
