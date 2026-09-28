import { useState } from "react";
import { skills } from "../../../data/skills";
import { cn } from "../../../lib/utils";

const FEATURED_SKILL_INDEX = 3;

// The preview is parked rather than carried. Its right edge sits on the end of
// the name column: that column and the description column are the two
// `minmax(_,1fr)` tracks either side of a 6.6rem and a 7rem fixed one, so they
// split whatever is left equally and the boundary lands at
// `6.6rem + (100% - 13.6rem) / 2`, which is 0.2rem short of the halfway mark.
const NAME_COLUMN_END = "calc(50% + 0.2rem)";

export function Skills() {
  // Null means the pointer is off the list. The row highlight falls back to the
  // featured skill so the table is never blank, but the preview keys off the
  // hover itself, so it is only on screen while a row is actually under the
  // pointer.
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const activeIndex = hoveredIndex ?? FEATURED_SKILL_INDEX;

  return (
    <section
      id="skills"
      aria-labelledby="skills-title"
      className="relative min-h-dvh w-full overflow-hidden bg-primary px-5 py-16 sm:px-8 lg:px-[4.48vw] lg:pt-8 lg:pb-20"
    >
      {/* Figma 642:3717 / 642:3823 / 642:3996 are this header's three marks, and they are spaced rather than placed: on the 1920 frame the row is the table's own 1768 wide, so justify-between leaves 862px of slack in two 431px gaps, putting the wordmark at 615 — the 616 the file records. */}
      <header className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
        {/* Paired on the phone, where a 9.9vw wordmark between them leaves room for neither; `contents` dissolves this wrapper at lg so all three become items of the one justified row. */}
        <div className="flex items-start justify-between lg:contents">
          <p className="font-accent text-sm uppercase leading-[1.2] text-primary/50 lg:text-base">
            [My Skills]
          </p>
          <p
            aria-hidden="true"
            className="font-accent text-sm uppercase leading-[1.2] text-primary/70 lg:order-last lg:text-base"
          >
            @003
          </p>
        </div>

        {/* 190px of Teko on a 1920 frame is 9.9vw, stated as vw so it keeps its share of the row and capped at the size it was drawn at. */}
        <h2
          id="skills-title"
          className="font-wordmark text-[clamp(56px,9.9vw,190px)] font-bold uppercase leading-none text-primary/70"
        >
          My Skills
        </h2>
      </header>

      <div className="relative mt-4 md:mt-6 2xl:mt-[4vh]">
        {/* Catches the pointer leaving through a gap or off the end, which no
            single row's own leave handler would see. */}
        <ul
          className="relative z-10"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {skills.map((skill, index) => {
            const isActive = index === activeIndex;
            const number = String(index + 1).padStart(2, "0");

            return (
              <li key={skill.name}>
                <button
                  type="button"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onFocus={() => setHoveredIndex(index)}
                  onBlur={() => setHoveredIndex(null)}
                  className={cn(
                    "grid min-h-23 w-full grid-cols-[minmax(0,1fr)_60px] items-center gap-4 border-b border-line py-4 text-left font-accent uppercase transition-colors duration-300 focus-visible:-outline-offset-2 focus-visible:outline-2 focus-visible:outline-accent lg:min-h-[6vh] lg:grid-cols-[6.6rem_minmax(12rem,1fr)_7rem_minmax(20rem,1fr)] lg:gap-0 lg:px-0 2xl:py-6 lg:text-base",
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
              </li>
            );
          })}
        </ul>

        {/* Above the rows, so the active row's white bar passes behind it
            rather than cutting across it. */}
        <div
          aria-hidden="true"
          style={{
            right: NAME_COLUMN_END,
            // Centred on the active row. Every row is the same height, so its
            // centre is a share of the table and needs no measuring: the CSS
            // stays correct if rows are added or the row height changes.
            top: `${((activeIndex + 0.5) / skills.length) * 100}%`,
          }}
          className="pointer-events-none absolute z-20 hidden -translate-y-1/2 transition-[top] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:block"
        >
          <div className="relative aspect-[360/450] w-[min(22vw,360px)]">
            {skills.map((skill, index) => (
              <img
                key={skill.name}
                src={skill.url}
                alt=""
                width={360}
                height={450}
                loading="lazy"
                decoding="async"
                className={cn(
                  // The tilt is the design's 3.2 degrees.
                  "absolute inset-0 h-full w-full rotate-[3.2deg] object-contain transition-opacity duration-300",
                  index === hoveredIndex ? "opacity-100" : "opacity-0",
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
