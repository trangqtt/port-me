import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { useRef, useState } from "react";
import { useImageCycleRandom } from "../../../hooks/useImageCycleRandom";
import { useIsMobile } from "../../../hooks/useIsMobile";
import { PixelMask, pixelsSortedOutIn } from "./PixelMask";

gsap.registerPlugin(useGSAP);

const DEFAULT_IMAGES = [
  "/images/intro-1.png",
  "/images/intro-2.png",
  "/images/intro-3.png",
] as const;

const splitWord = (word: string) =>
  Array.from(word).map((letter, index) => (
    <span
      key={`${letter}-${index}`}
      data-intro-letter
      className="relative block"
    >
      {letter}
    </span>
  ));

export function IntroOverlay() {
  const [done, setDone] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const imageBoxRef = useRef<HTMLSpanElement>(null);
  const growingImageRef = useRef<HTMLSpanElement>(null);
  const headingStartRef = useRef<HTMLSpanElement>(null);
  const headingEndRef = useRef<HTMLSpanElement>(null);
  const roleLabelRef = useRef<HTMLParagraphElement>(null);
  const pixelMaskRef = useRef<HTMLDivElement>(null);
  const { addImageCycleRandomSequence, cycleImages, imageCycleRef } =
    useImageCycleRandom(DEFAULT_IMAGES);
  const isMobile = useIsMobile();

  useGSAP(
    () => {
      const root = rootRef.current;
      const imageBox = imageBoxRef.current;
      const growingImage = growingImageRef.current;

      if (!root) return;

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        setDone(true);
        return;
      }

      const timeline = gsap.timeline({
        defaults: { ease: "expo.inOut" },
        onComplete: () => setDone(true),
      });

      timeline.set(roleLabelRef.current, {
        autoAlpha: 0,
        width: 0,
      });

      if (isMobile) {
        timeline
          .set(imageBoxRef.current, { display: "none" })
          .set(headingStartRef.current, { display: "none" })
          .set(headingEndRef.current, { display: "none" })
          .set(imageCycleRef.current, { autoAlpha: 0 })
          .set([headingStartRef.current, headingEndRef.current], {
            autoAlpha: 0,
          });

        addImageCycleRandomSequence(timeline);

        timeline.to(
          [headingStartRef.current, headingEndRef.current],
          { display: "flex", autoAlpha: 1, duration: 0.85 },
          ">",
        );
      }

      if (!isMobile && imageBox && growingImage) {
        const letters = root.querySelectorAll("[data-intro-letter]");
        const extraImages = root.querySelectorAll("[data-intro-image-extra]");

        timeline
          .set(imageCycleRef.current, { display: "none" })
          .from(letters, {
            yPercent: 110,
            duration: 1.25,
            stagger: 0.04,
          })
          .fromTo(
            imageBox,
            { width: 0, autoAlpha: 0 },
            { width: "430px", autoAlpha: 1, duration: 1.25 },
            ">1.25",
          )
          .fromTo(
            growingImage,
            {
              width: "0%",
              scale: 0.1,
              left: "50%",
              xPercent: -50,
            },
            { width: "100%", scale: 1, duration: 1.25 },
            "<",
          )
          .to(headingStartRef.current, { x: "-0.05em", duration: 1.25 }, "<")
          .to(headingEndRef.current, { x: "0.05em", duration: 1.25 }, "<")
          .to(
            extraImages,
            {
              opacity: 0,
              duration: 0.06,
              ease: "none",
              stagger: 0.35,
            },
            "<+=0.6",
          )
          .to(
            growingImage,
            {
              autoAlpha: 0,
              scale: 0,
              duration: 0.5,
              ease: "back.in(0.2)",
            },
            ">+=0.25",
          )
          .to(imageBox, { width: "0em", duration: 0.85 }, "<")
          .to(
            [headingStartRef.current, headingEndRef.current],
            { x: 0, duration: 0.85 },
            "<",
          );
      }

      timeline
        .to(
          roleLabelRef.current,
          {
            autoAlpha: 1,
            width: "auto",
            duration: 0.8,
            ease: "expo.out",
          },
          ">",
        )
        .add(() => {
          const mask = pixelMaskRef.current;
          if (mask) mask.style.visibility = "visible";
        }, ">+=0.6")
        .to(
          pixelsSortedOutIn(pixelMaskRef.current),
          {
            autoAlpha: 1,
            duration: 0.05,
            ease: "power2.out",
            stagger: { each: 0.0001 },
          },
          "<",
        )
        .to(
          root,
          { autoAlpha: 0, duration: 0.6, ease: "power2.out" },
          ">+=0.15",
        );

      return () => timeline.kill();
    },
    { scope: rootRef, dependencies: [isMobile] },
  );

  if (done) return null;

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-bg-primary"
    >
      <div className="flex flex-col sm:flex-row items-end gap-0 sm:gap-3 justify-end">
        <h1
          aria-label="Mai Hoa"
          className="flex items-center justify-center whitespace-nowrap font-display text-[clamp(64px,16vw,200px)] font-medium leading-none sm:leading-normal"
        >
          <span
            ref={headingStartRef}
            aria-hidden="true"
            className="flex justify-end overflow-hidden px-[0.12em]"
          >
            {splitWord("Mai")}
          </span>

          <span
            ref={imageCycleRef}
            aria-hidden="true"
            className="relative inline-block aspect-430/500 max-w-107.5 w-80 shrink-0 align-middle sm:hidden"
          >
            {cycleImages.map((src, index) => (
              <img
                key={`${src}-${index}`}
                src={src}
                alt=""
                aria-hidden="true"
                width={430}
                height={500}
                loading="eager"
                decoding="async"
                fetchPriority={
                  index === cycleImages.length - 1 ? "high" : "auto"
                }
                data-image-cycle-card
                className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
              />
            ))}
          </span>

          <span
            ref={imageBoxRef}
            aria-hidden="true"
            className="relative hidden h-[1em] w-0 shrink-0 align-middle sm:inline-block"
          >
            <span
              ref={growingImageRef}
              className="absolute flex h-full w-0 items-center justify-center overflow-visible"
            >
              <span className="relative flex items-center justify-center">
                {DEFAULT_IMAGES.map((src, index) => (
                  <img
                    key={src}
                    src={src}
                    alt=""
                    aria-hidden="true"
                    width={430}
                    height={500}
                    loading="eager"
                    decoding="async"
                    fetchPriority={
                      index === DEFAULT_IMAGES.length - 1 ? "high" : "auto"
                    }
                    data-intro-image-extra={
                      index < DEFAULT_IMAGES.length - 1 ? "" : undefined
                    }
                    className="pointer-events-none absolute left-1/2 top-1/2 h-125 w-107.5 max-w-none -translate-x-1/2 -translate-y-1/2 select-none object-cover"
                    style={{ zIndex: DEFAULT_IMAGES.length - index }}
                  />
                ))}
              </span>
            </span>
          </span>

          <span
            ref={headingEndRef}
            aria-hidden="true"
            className="flex justify-start overflow-hidden px-[0.12em]"
          >
            {splitWord("Hoa")}
          </span>
        </h1>

        <p
          ref={roleLabelRef}
          className="inline-block overflow-hidden whitespace-nowrap text-base sm:text-4xl uppercase text-primary/70 font-accent m-y-auto sm:m-auto leading-none"
        >
          [UIUX DESIGN]
        </p>
      </div>

      <PixelMask ref={pixelMaskRef} />
    </div>
  );
}
