import { gsap } from "gsap";
import { useMemo, useRef } from "react";

const CYCLE_INTERVAL = 0.34;
const POSITION_RANGE = 1;

// How many cards stay in the DOM. The stack is what keeps whatever sits
// behind the cycle covered while the newest card scales up over it, so it
// has to be more than one even where the markup mounts a single frame.
const LIVE_CARDS = 3;

export function useImageCycleRandom(images: readonly string[]) {
  const imageCycleRef = useRef<HTMLDivElement>(null);
  const cycleImages = useMemo(() => [...images], [images]);
  const cardOffsets = useMemo(
    () =>
      images.map(() => ({
        x: POSITION_RANGE,
        y: POSITION_RANGE,
      })),
    [images],
  );


  // Duplicates cards forever: each tick clones the next source image, fades
  // it in, and removes the oldest clone once the pool is full.
  const addImageCycleInfiniteSequence = (timeline: gsap.core.Timeline) => {
    const container = imageCycleRef.current;
    const cards = container?.querySelectorAll<HTMLElement>(
      "[data-image-cycle-card]",
    );
    if (!container || !cards?.length) return;

    const template = cards[0] as HTMLImageElement;
    // Resume after the frames already on screen, so the first tick is a real
    // switch rather than a clone of the one the reveal just uncovered.
    let nextIndex = cards.length;

    const spawnNext = () => {
      const offset = cardOffsets[nextIndex % cardOffsets.length] ?? {
        x: 0,
        y: 0,
      };
      const clone = template.cloneNode(true) as HTMLImageElement;
      clone.src = cycleImages[nextIndex % cycleImages.length];
      // Only the very first render should be eager/high-priority — every
      // spawned clone thereafter must load lazily like the rest.
      clone.loading = "lazy";
      clone.fetchPriority = "auto";
      container.appendChild(clone);

      gsap.fromTo(
        clone,
        { autoAlpha: 0, scale: 0, x: offset.x, y: offset.y },
        {
          autoAlpha: 1,
          scale: 1,
          x: offset.x,
          y: offset.y,
          duration: 1,
          ease: "power3.out",
        },
      );

      nextIndex += 1;

      const live = container.querySelectorAll("[data-image-cycle-card]");
      if (live.length > LIVE_CARDS) {
        const oldest = live[0] as HTMLElement;
        // Drops out of the query straight away, so the next tick can't pick
        // the same card again while this one is still fading.
        oldest.removeAttribute("data-image-cycle-card");
        gsap.to(oldest, {
          autoAlpha: 0,
          scale: 0,
          duration: 0.1,
          ease: "power2.out",
          onComplete: () => oldest.remove(),
        });
      }
    };

    const loop = gsap.timeline({ repeat: -1 });
    loop.call(spawnNext, undefined, `+=${CYCLE_INTERVAL}`);
    timeline.add(loop);
  };

  return {
    addImageCycleInfiniteSequence,
    cycleImages,
    imageCycleRef,
  };
}
