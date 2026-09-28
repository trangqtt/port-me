import { gsap } from "gsap";
import { useMemo, useRef } from "react";

const CYCLE_INTERVAL = 0.34;
const POSITION_RANGE = 1;

// How many cards stay in the DOM; the stack keeps what sits behind covered while the newest card scales up, so it must be more than one.
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


  // Duplicates cards forever: each tick clones the next image, fades it in and removes the oldest once the pool is full.
  const addImageCycleInfiniteSequence = (timeline: gsap.core.Timeline) => {
    const container = imageCycleRef.current;
    const cards = container?.querySelectorAll<HTMLElement>(
      "[data-image-cycle-card]",
    );
    if (!container || !cards?.length) return;

    const template = cards[0] as HTMLImageElement;
    // Resume after the frames already on screen, so the first tick is a real switch rather than a clone of the one just uncovered.
    let nextIndex = cards.length;

    const spawnNext = () => {
      const offset = cardOffsets[nextIndex % cardOffsets.length] ?? {
        x: 0,
        y: 0,
      };
      const clone = template.cloneNode(true) as HTMLImageElement;
      clone.src = cycleImages[nextIndex % cycleImages.length];
      // Only the very first render is eager and high-priority; every spawned clone loads lazily.
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
        // Drops out of the query straight away, so the next tick cannot pick the same card while it is still fading.
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
