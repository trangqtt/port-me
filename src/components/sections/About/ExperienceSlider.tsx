"use client";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { useLenis } from "lenis/react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ExperienceItem } from "../../../data/experience";
import { cn } from "../../../lib/utils";

gsap.registerPlugin(useGSAP);

interface ExperienceSliderProps {
  items: readonly ExperienceItem[];
}

// Header-row height (px) left peeking above the next card as it stacks over it.
const MOBILE_CARD_PEEK = 164;

// The two pictures tile the frame along its diagonal, so their scales must sum to 1: `1 - |offset|` is the only shape, and the handover is continuous.
const ORIGIN_CURRENT = "0% 0%";
const ORIGIN_NEXT = "100% 100%";

// Wheel travel, in px of deltaY, worth one whole slide.
const WHEEL_PER_SLIDE = 700;
// Clicking a dot is the one move with no scroll behind it to scrub from.
const JUMP_DURATION = 0.7;

// How near the section top must be to the viewport top before the strip takes scroll; snap parks it at 0, so this only absorbs rounding and wheel overshoot.
const ENGAGE_EPSILON = 120;

// Progress this close to an end counts as being at it, so a float residue left by a scrub cannot read as "a slide still to play" and re-lock the section it just released.
const SETTLE_EPSILON = 0.01;

// Pure and total: every picture has a size at every scroll position, so interruptions, reversals and rebuilds resolve to the same frame.
const frameStateAt = (offset: number) => {
  if (offset >= 1 || offset <= -1) {
    return { scale: 0, transformOrigin: ORIGIN_NEXT, autoAlpha: 0 };
  }
  return {
    scale: 1 - Math.abs(offset),
    // Ahead of the current slide it grows from the bottom-right corner; behind, it shrinks into the top-left.
    transformOrigin: offset > 0 ? ORIGIN_NEXT : ORIGIN_CURRENT,
    autoAlpha: 1,
  };
};

export function ExperienceSlider({ items }: ExperienceSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const imageFrameRefs = useRef<(HTMLDivElement | null)[]>([]);
  // The real position; `activeIndex` is its rounded shadow in state because only copy, dots and stacking need a re-render.
  const progressRef = useRef(0);
  const jumpRef = useRef<gsap.core.Tween | null>(null);
  const lenis = useLenis();

  const renderFrames = useCallback((progress: number) => {
    const settled = Math.round(progress);
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    imageFrameRefs.current.forEach((frame, index) => {
      if (!frame) return;
      gsap.set(
        frame,
        reduced
          ? {
              scale: 1,
              transformOrigin: ORIGIN_CURRENT,
              autoAlpha: index === settled ? 1 : 0,
            }
          : frameStateAt(index - progress),
      );
    });
  }, []);

  const setProgress = useCallback(
    (progress: number) => {
      progressRef.current = progress;
      renderFrames(progress);
      setActiveIndex(Math.round(progress));
    },
    [renderFrames],
  );

  useGSAP(
    () => {
      renderFrames(progressRef.current);
      return () => {
        jumpRef.current?.kill();
      };
    },
    { scope: containerRef },
  );

  // Entering hands page scroll to the strip until it runs out; Lenis is stopped instead of a ScrollTrigger pin because the mandatory snap would fight a pin's extra scroll distance.
  useEffect(() => {
    const container = containerRef.current;
    const section = container?.closest("section");
    if (!lenis || !container || !section) return;
    // The strip only exists from `lg` up; below that the section is a scrollable stack of cards.
    if (!window.matchMedia("(min-width: 1024px)").matches) return;

    const last = items.length - 1;
    let locked = false;
    // Direction is derived, not read from `lenis.direction`, which is `1 | -1 | 0`; the zero makes a "not down" test true while standing still, so a settling scroll at the end of the strip takes the upward branch and re-locks.
    let lastScroll = lenis.scroll;

    const onLockedWheel = (event: WheelEvent) => {
      event.preventDefault();
      jumpRef.current?.kill();

      const next = Math.min(
        Math.max(progressRef.current + event.deltaY / WHEEL_PER_SLIDE, 0),
        last,
      );
      progressRef.current = next;
      renderFrames(next);
      setActiveIndex(Math.round(next));

      // Released only at the end the wheel pushes towards, so arriving at slide 3 from above does not also release upwards.
      if (
        (event.deltaY > 0 && next >= last) ||
        (event.deltaY < 0 && next <= 0)
      ) {
        release();
      }
    };

    function release() {
      if (!locked) return;
      locked = false;
      window.removeEventListener("wheel", onLockedWheel);
      lastScroll = lenis?.scroll ?? lastScroll;
      lenis?.start();
    }

    const engage = () => {
      if (locked) return;
      locked = true;
      lenis.stop();
      // Park the section at the top via Lenis, not window.scrollBy, so Lenis's own scroll position never disagrees and jumps on restart.
      lenis.scrollTo(section as HTMLElement, { immediate: true, force: true });
      // The park is a jump the next delta must not be measured against.
      lastScroll = lenis.scroll;
      window.addEventListener("wheel", onLockedWheel, { passive: false });
    };

    const onScroll = () => {
      const previous = lastScroll;
      lastScroll = lenis.scroll;
      if (locked) return;

      const delta = lastScroll - previous;
      if (delta === 0) return;
      if (Math.abs(section.getBoundingClientRect().top) > ENGAGE_EPSILON)
        return;

      const progress = progressRef.current;

      // Down: held until the strip is played out. Up: held only while there is strip left behind it, so at the first slide the page is free to carry on to the hero.
      if (
        delta > 0 ? progress < last - SETTLE_EPSILON : progress > SETTLE_EPSILON
      ) {
        engage();
      }
    };

    lenis.on("scroll", onScroll);
    return () => {
      lenis.off("scroll", onScroll);
      release();
    };
  }, [lenis, items.length, renderFrames]);

  const jumpTo = (index: number) => {
    jumpRef.current?.kill();
    const position = { value: progressRef.current };
    jumpRef.current = gsap.to(position, {
      value: index,
      duration: JUMP_DURATION,
      ease: "expo.out",
      onUpdate: () => setProgress(position.value),
    });
  };

  return (
    <div className="flex flex-col lg:min-h-0 lg:flex-1 lg:flex-row gap-0 md:gap-10 2xl:gap-28">
      <p className="font-accent text-sm uppercase leading-[1.2] text-primary/70">
        [Experience]
      </p>

      {/* Mobile Sticky Card Stack */}
      <ul className="relative flex flex-col h-275 mb-45 lg:hidden">
        {items.map((item, index) => (
          <li
            key={`${item.company}-${index}`}
            className="sticky border-line bg-bg-primary"
            style={{
              top: index * MOBILE_CARD_PEEK,
              zIndex: index + 1,
              borderTopWidth: index !== 0 ? "1px" : "0",
            }}
          >
            <div className="flex flex-col gap-6 py-8">
              <div className="flex items-end justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <p className="font-display text-xl text-primary">
                    {item.company}
                  </p>
                  <p className="font-accent text-sm uppercase text-primary/70">
                    {item.role}
                  </p>
                </div>
                <p className="font-accent text-sm whitespace-nowrap uppercase text-primary/70">
                  {item.period}
                </p>
              </div>

              <div className="h-49 w-45">
                <img
                  src={item.image}
                  alt=""
                  aria-hidden="true"
                  width={1200}
                  height={900}
                  loading="lazy"
                  decoding="async"
                  className="pointer-events-none size-full object-cover"
                />
              </div>

              <p className="font-accent text-sm uppercase leading-[1.2] text-primary/70">
                {item.description}
              </p>
            </div>
          </li>
        ))}
      </ul>

      {/* Desktop slider */}
      <div
        ref={containerRef}
        role="group"
        aria-label="Experience"
        // Height comes from the space the section has left, not from a share of the viewport: a fixed dvh here plus the section's own fixed padding always added up to more than one screen.
        className="relative hidden h-full w-[85dvw] overflow-hidden lg:block"
      >
        <ul>
          {items.map((item, index) => (
            <li
              key={`${item.company}-${index}`}
              aria-hidden={index !== activeIndex}
              className={cn(
                "absolute inset-0 grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,3.5fr)] 2xl:grid-cols-[minmax(0,1.1fr)_minmax(0,5.6fr)_minmax(0,6fr)] items-start gap-8",
                // Stacking order, not visibility: the frames below are opaque and pixel-aligned, so the active slide covers them without JS.
                index === activeIndex
                  ? "z-2"
                  : index === activeIndex + 1
                    ? "pointer-events-none z-3"
                    : "pointer-events-none z-1",
              )}
            >
              <div
                className={cn(
                  "flex flex-col items-start gap-1 transition-opacity duration-500",
                  index === activeIndex ? "opacity-100" : "opacity-0",
                )}
              >
                <p className="font-display text-2xl text-primary">
                  {item.company}
                </p>
                <p className="font-accent text-sm uppercase text-primary/70">
                  {item.role}
                </p>
              </div>

              {/* Outside the crossfade on purpose (scaled, never faded); the outer frame clips and never moves, only the inner layer scales, from an origin set in CSS before any script measures. */}
              <div className="relative aspect-536/582 w-full overflow-hidden">
                <div
                  ref={(node) => {
                    imageFrameRefs.current[index] = node;
                  }}
                  className="h-full w-full"
                >
                  <img
                    src={item.image}
                    alt=""
                    aria-hidden="true"
                    width={536}
                    height={582}
                    loading="lazy"
                    decoding="async"
                    className="pointer-events-none size-full object-cover"
                  />
                </div>
              </div>

              <div
                className={cn(
                  "flex flex-col justify-between self-stretch font-accent text-sm lg:text-base leading-[1.2] text-primary/70 uppercase transition-opacity duration-500",
                  index === activeIndex ? "opacity-100" : "opacity-0",
                )}
              >
                <p>{item.period}</p>
                <p className="max-w-96.25">{item.description}</p>
              </div>
            </li>
          ))}
        </ul>

        {/* Vertical scroll progress — click a dot to jump to that entry. */}
        <div className="absolute top-1/10 right-0 flex flex-col gap-1">
          {items.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Go to experience ${index + 1}`}
              aria-current={index === activeIndex}
              onClick={() => jumpTo(index)}
              className={cn(
                "h-15 w-1 cursor-pointer rounded bg-white transition-opacity duration-300 hover:opacity-100",
                index === activeIndex ? "opacity-100" : "opacity-20",
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
