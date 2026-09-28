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
      className="relative min-h-dvh w-full overflow-hidden bg-primary px-5 py-16 lg:py-22 sm:px-8 lg:px-[4.48vw] lg:pb-20 2xl:pt-[10vh]"
    >
      <header className="relative flex flex-col gap-1 lg:block">
        <p className="font-accent text-sm uppercase leading-[1.2] text-primary/50 lg:absolute lg:left-0 lg:top-[1.66%] lg:text-base">
          [My Skills]
        </p>

        {/* One line, sized off the frame: the 190px block on a 1920 frame is
            9.896vw, and Teko is condensed enough that it never needs fitting.
            Centred on the section rather than on its own measured box, which
            in the frame sits a few pixels right of centre. */}
        {/* `.font-display` and `.font-wordmark` are hand-written utilities, so
            Tailwind has no breakpoint variants for them and the later of the
            two would win at every width. Two spans, one per face, the way the
            hero already switches its wordmark. */}
        <h2 id="skills-title">
          <span className="font-display text-[26px] font-medium leading-[1.2] text-primary lg:hidden">
            My Skills
          </span>
          {/* 190px on the 1920 frame, and Teko is condensed enough to hold the
              line without fitting. */}
          <span className="hidden font-wordmark text-[9.896vw] font-bold uppercase leading-none text-primary/60 lg:block lg:text-center">
            My Skills
          </span>
        </h2>

        <p
          aria-hidden="true"
          className="hidden font-accent text-base uppercase leading-[1.2] text-primary/50 lg:absolute lg:right-0 lg:top-[1.17%] lg:block"
        >
          @003
        </p>
      </header>

      <div ref={containerRef} className="relative mt-4 md:mt-6 2xl:mt-17">
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
                    "grid min-h-23 w-full grid-cols-[minmax(0,1fr)_60px] items-center gap-4 border-b border-line py-4 text-left font-accent uppercase transition-colors duration-300 focus-visible:-outline-offset-2 focus-visible:outline-2 focus-visible:outline-accent lg:min-h-16 lg:grid-cols-[11.2%_minmax(0,48.87%)_6.1%_minmax(0,1fr)] lg:gap-0 lg:px-0 lg:py-0 lg:text-base",
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
                    <span className="text-sm leading-[1.2] lg:col-start-4 lg:row-start-1 lg:text-right lg:text-base lg:leading-none">
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
                  width={400}
                  height={450}
                  loading="lazy"
                  decoding="async"
                  className="pointer-events-none fixed left-0 top-0 z-30 hidden h-[23.4vw] max-h-[450px] w-[20vw] max-w-[400px] object-contain opacity-0 lg:block"
                />
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
