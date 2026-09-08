import { useMemo, useRef } from "react";

const CYCLE_INTERVAL = 0.34;
const POSITION_RANGE = 8;

export function useImageCycleRandom(images: readonly string[]) {
  const imageCycleRef = useRef<HTMLDivElement>(null);
  const cycleImages = useMemo(() => [...images], [images]);
  const cardOffsets = useMemo(
    () =>
      images.map(() => ({
        x: (Math.random() - 0.5) * POSITION_RANGE * 2,
        y: (Math.random() - 0.5) * POSITION_RANGE * 2,
      })),
    [images],
  );

  const addImageCycleRandomSequence = (timeline: gsap.core.Timeline) => {
    const cards = imageCycleRef.current?.querySelectorAll<HTMLElement>(
      "[data-image-cycle-card]",
    );
    if (!cards?.length) return;

    timeline
      .set(imageCycleRef.current, { autoAlpha: 1, scale: 1 }, "<")
      .set(cards, { autoAlpha: 0, scale: 0 });

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

    timeline.addLabel("imageCycleCollapseStart", `>+=0.2`).to(
      imageCycleRef.current,
      {
        display: "none",
        autoAlpha: 0,
        scale: 0,
        duration: 0.75,
        ease: "expo.inOut",
      },
      "imageCycleCollapseStart",
    );
  };

  return {
    addImageCycleRandomSequence,
    cycleImages,
    imageCycleRef,
  };
}
