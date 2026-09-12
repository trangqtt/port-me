"use client";
import { useEffect, useRef, useState } from "react";
import type { ExperienceItem } from "../../../data/experience";
import { cn } from "../../../lib/utils";

interface ExperienceSliderProps {
  items: readonly ExperienceItem[];
}

// Header-row height (px) left peeking above the next card as it stacks over it.
const MOBILE_CARD_PEEK = 164;

export function ExperienceSlider({ items }: ExperienceSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeIndexRef = useRef(0);
  const isAnimatingRef = useRef(false);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Wheel over the slider steps through slides instead of scrolling the
    // page; only once you're past the first/last slide does the page scroll.
    const onWheel = (event: WheelEvent) => {
      const goingNext = event.deltaY > 0;
      const atStart = activeIndexRef.current === 0;
      const atEnd = activeIndexRef.current === items.length - 1;

      if ((goingNext && atEnd) || (!goingNext && atStart)) return;

      event.preventDefault();
      if (isAnimatingRef.current) return;

      isAnimatingRef.current = true;
      setActiveIndex((current) =>
        goingNext
          ? Math.min(current + 1, items.length - 1)
          : Math.max(current - 1, 0),
      );
      window.setTimeout(() => {
        isAnimatingRef.current = false;
      }, 600);
    };

    container.addEventListener("wheel", onWheel, { passive: false });
    return () => container.removeEventListener("wheel", onWheel);
  }, [items.length]);

  return (
    <div className="flex flex-col lg:flex-row gap-0 md:gap-10 2xl:gap-28">
      <p className="font-accent text-sm uppercase leading-[1.2] text-primary/70">
        [Experience]
      </p>

      {/* Mobile Sticky Card Stack */}
      <ul className="relative flex flex-col h-275 mb-25 lg:hidden">
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
                "absolute inset-x-0 top-0 grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)_minmax(0,3.5fr)] 2xl:grid-cols-[minmax(0,1.1fr)_minmax(0,5.6fr)_minmax(0,6fr)] items-start gap-8 transition-opacity duration-500",
                index === activeIndex
                  ? "opacity-100"
                  : "pointer-events-none opacity-0",
              )}
            >
              <div className="flex flex-col items-start gap-1">
                <p className="font-display text-2xl text-primary">
                  {item.company}
                </p>
                <p className="font-accent text-sm uppercase text-primary/70">
                  {item.role}
                </p>
              </div>

              <div className="aspect-536/582 w-full">
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

              <div className="flex flex-col justify-between self-stretch font-accent text-sm lg:text-base leading-[1.2] text-primary/70 uppercase">
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
              onClick={() => setActiveIndex(index)}
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
