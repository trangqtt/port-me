import { gsap } from "gsap";
import { useMemo, useRef } from "react";

const CYCLE_INTERVAL = 0.34;
const POSITION_RANGE = 8;

export function useImageCycleRandom(images: readonly string[]) {
  const imageCycleRef = useRef<HTMLDivElement>(null);
  const cycleImages = useMemo(() => [...images], [images]);
  const cardOffsets = useMemo(
    () =>
      images.map(() => ({
        x: Math.random() * POSITION_RANGE * 3,
        y: Math.random() * POSITION_RANGE * 3,
      })),
    [images],
  );

  const addImageCycleRandomSequence = (timeline: gsap.core.Timeline) => {
    const container = imageCycleRef.current;
    const cards = container?.querySelectorAll<HTMLElement>(
      "[data-image-cycle-card]",
    );
    if (!container || !cards?.length) return;

    Array.from(cards).forEach((card, index) => {
      const offset = cardOffsets[index] ?? { x: 0, y: 0 };

      timeline.fromTo(
        card,
        { autoAlpha: 0, scale: 0, x: offset.x, y: offset.y },
        {
          autoAlpha: 1,
          scale: 1,
          x: offset.x,
          y: offset.y,
          duration: 1,
          ease: "power3.out",
        },
        index === 0 ? "<" : `<+=${CYCLE_INTERVAL}`,
      );
    });
  };

  // Duplicates cards forever: each tick clones the next source image, fades
  // it in, and removes the oldest clone once the pool is full.
  const addImageCycleInfiniteSequence = (timeline: gsap.core.Timeline) => {
    const container = imageCycleRef.current;
    const cards = container?.querySelectorAll<HTMLElement>(
      "[data-image-cycle-card]",
    );
    if (!container || !cards?.length) return;

    const template = cards[0] as HTMLImageElement;
    const poolSize = cards.length;
    let nextIndex = poolSize;

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
      if (live.length > poolSize) {
        const oldest = live[0] as HTMLElement;
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
    addImageCycleRandomSequence,
    addImageCycleInfiniteSequence,
    cycleImages,
    imageCycleRef,
  };
}
