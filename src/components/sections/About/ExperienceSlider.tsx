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

// The two pictures always tile the frame along its diagonal, meeting at a
// single point that slides up it as you scroll. The current one is pinned to
// the frame's top-left and its opposite corner is the meeting point; the next
// one starts at that same meeting point and is pinned to the frame's
// bottom-right. Their other two corners just follow.
//
// Tiling exactly is what forces the arithmetic: the two scales have to sum to
// 1 at every scroll position, which leaves `1 - |offset|` as the only shape
// the pair can take. It also makes the handover continuous — the picture
// arriving reaches scale 1 at the same instant the one leaving reaches 0, so
// there is no moment where a size has to jump.
const ORIGIN_CURRENT = "0% 0%";
const ORIGIN_NEXT = "100% 100%";

// Wheel travel, in px of deltaY, worth one whole slide.
const WHEEL_PER_SLIDE = 700;
// Clicking a dot is the one move with no scroll behind it to scrub from.
const JUMP_DURATION = 0.7;

// How close the section's top has to be to the viewport's before the strip
// takes the scroll. Lenis's mandatory snap parks it at exactly 0, so this only
// has to absorb sub-pixel rounding and a fast wheel overshooting the landing.
const ENGAGE_EPSILON = 120;

// Pure, and total: every picture has a defined size at every scroll position,
// so an interrupted scroll, a reversal and a rebuild all resolve to the same
// frame. Scrolling back up is this same function read with a smaller number.
const frameStateAt = (offset: number) => {
  if (offset >= 1 || offset <= -1) {
    return { scale: 0, transformOrigin: ORIGIN_NEXT, autoAlpha: 0 };
  }
  return {
    scale: 1 - Math.abs(offset),
    // Ahead of the current slide it grows out of the bottom-right corner;
    // behind it, it shrinks into the top-left. Same diagonal, two halves.
    transformOrigin: offset > 0 ? ORIGIN_NEXT : ORIGIN_CURRENT,
    autoAlpha: 1,
  };
};

export function ExperienceSlider({ items }: ExperienceSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const imageFrameRefs = useRef<(HTMLDivElement | null)[]>([]);
  // The real position. `activeIndex` is only the rounded shadow of it, kept in
  // state because the copy, the dots and the stacking order are the parts that
  // do need a re-render; the pictures are written straight to the DOM.
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

  // Entering the section hands the page's scroll to the strip and holds it
  // until the strip runs out in the direction of travel. Lenis is stopped
  // rather than a ScrollTrigger pin being used: a pin would need the section
  // to grow by its own scroll distance, and the mandatory snap on
  // `main > section` would spend that whole distance trying to pull the page
  // to the next section's start. Stopping Lenis suspends the snap with it.
  useEffect(() => {
    const container = containerRef.current;
    const section = container?.closest("section");
    if (!lenis || !container || !section) return;
    // The strip itself only exists from `lg` up; below that the section is a
    // stack of cards that must stay scrollable.
    if (!window.matchMedia("(min-width: 1024px)").matches) return;

    const last = items.length - 1;
    let locked = false;

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

      // Released only at the end the wheel is pushing towards, so arriving at
      // slide 3 from above does not also release upwards on the same gesture.
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
      lenis?.start();
    }

    const engage = () => {
      if (locked) return;
      locked = true;
      lenis.stop();
      // Park the section against the top, so the strip is framed identically
      // whichever direction it was entered from.
      window.scrollBy(0, section.getBoundingClientRect().top);
      window.addEventListener("wheel", onLockedWheel, { passive: false });
    };

    const onScroll = () => {
      if (locked) return;
      const { top } = section.getBoundingClientRect();
      if (Math.abs(top) > ENGAGE_EPSILON) return;

      const progress = progressRef.current;
      // Coming down with slides left, or back up with slides behind — either
      // way there is something for the strip to do, so it takes the scroll.
      if (top <= 0 ? progress < last : progress > 0) engage();
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
    <div className="flex flex-col lg:flex-row gap-0 md:gap-10 2xl:gap-28">
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
        className="relative hidden h-[60dvh] w-[85dvw] overflow-hidden lg:block"
      >
        <ul>
          {items.map((item, index) => (
            <li
              key={`${item.company}-${index}`}
              aria-hidden={index !== activeIndex}
              className={cn(
                "absolute inset-x-0 top-0 grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,3.5fr)] 2xl:grid-cols-[minmax(0,1.1fr)_minmax(0,5.6fr)_minmax(0,6fr)] items-start gap-8",
                // Stacking order, not visibility: the frames below are opaque
                // and pixel-aligned, so the active slide covers them even with
                // no JS to hide anything.
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

              {/* Deliberately outside the crossfade above: this picture is
                  scaled, never faded.

                  Two boxes, not one. The outer frame never moves and clips, so
                  the arriving picture is physically unable to paint outside the
                  picture's own bounds however the scale is measured. The inner
                  layer is the only thing that scales, and it declares its own
                  origin in CSS rather than taking one from GSAP, so the corner
                  it grows from is set before any script measures a box. */}
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
