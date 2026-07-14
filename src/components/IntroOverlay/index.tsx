// src/components/ui/IntroOverlay.tsx
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { useRef, useState } from "react";
import { LoadingPathLoop } from "../ui/LoadingPathLoop";

gsap.registerPlugin(useGSAP);

interface IntroOverlayProps {
  stage1Images?: [string, string, string];
}

export function IntroOverlay({
  stage1Images = [
    "/images/intro-1.png",
    "/images/intro-2.png",
    "/images/intro-3.png",
  ],
}: IntroOverlayProps) {
  const [done, setDone] = useState(false);
  const [ratios, setRatios] = useState<number[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const imgWrapRef = useRef<HTMLDivElement>(null);

  const allRatiosReady =
    ratios.length === stage1Images.length && ratios.every(Boolean);

  useGSAP(
    () => {
      if (!allRatiosReady) return;

      const HOLD = 0.6;
      const SWAP = 0.35;

      const tl = gsap.timeline({
        defaults: { ease: "expo.out", duration: 0.9 },
        onComplete: () => {
          setDone(true);
        },
      });

      // ----- Stage 1: Mai [img cycles x3] Hoa -----
      tl.set(".stage", { autoAlpha: 0 })
        .set(".stage-1", { autoAlpha: 1 })
        .set(".stage-1 .inline-img", { autoAlpha: 0 })
        .set(".word-title", { autoAlpha: 0 })
        .set(".loading-wrapper", { autoAlpha: 0 })
        .set(imgWrapRef.current, { aspectRatio: ratios[0] })
        // Words start hidden behind the image, then slide outward to reveal.
        .from(
          ".word-left",
          { x: () => (imgWrapRef.current?.offsetWidth ?? 0) + 24 },
          0,
        )
        .from(
          ".word-right",
          { x: () => -((imgWrapRef.current?.offsetWidth ?? 0) + 24) },
          0,
        )
        // First image — scaled in with a bounce as the "hero" reveal.
        .fromTo(
          ".stage-1 .inline-img-0",
          { scale: 0, rotate: -8, autoAlpha: 0 },
          { scale: 1, rotate: 0, autoAlpha: 1, ease: "back.out(0.6)" },
          `-=${HOLD}`,
        )
        // Swap to image 2 — wrapper width morphs to match its aspect ratio.
        .to(
          ".stage-1 .inline-img-0",
          { autoAlpha: 0, duration: 0.2 },
          `+=${SWAP}`,
        )
        .to(
          imgWrapRef.current,
          { aspectRatio: ratios[1], duration: 0.45, ease: "power3.inOut" },
          "<",
        )
        .fromTo(
          ".stage-1 .inline-img-1",
          { scale: 1.08, autoAlpha: 0 },
          { scale: 1, autoAlpha: 1, duration: 0.35, ease: "power3.out" },
          "<",
        )
        // Swap to image 3.
        .to(
          ".stage-1 .inline-img-1",
          { autoAlpha: 0, duration: 0.2 },
          `+=${SWAP}`,
        )
        .to(
          imgWrapRef.current,
          { aspectRatio: ratios[2], duration: 0.45, ease: "power3.inOut" },
          "<",
        )
        .fromTo(
          ".stage-1 .inline-img-2",
          { scale: 1.08, autoAlpha: 0 },
          { scale: 1, autoAlpha: 1, duration: 0.35, ease: "power3.out" },
          "<",
        )
        // Outro: after slide 3, smoothly collapse the image — Mai + Hoa slide in to reunite.
        .to(
          imgWrapRef.current,
          { width: 0, duration: 0.8, ease: "power3.inOut" },
          `+=${HOLD}`,
        )
        .to(
          ".stage-1 .inline-img-2",
          { autoAlpha: 0, duration: 0.5, ease: "power2.in" },
          "<",
        )
        .set(imgWrapRef.current, { display: "none" })
        // ----- Stage 2: [UIUX DESIGN] wipes in → Mai/Hoa shift left via flex reflow -----
        .to(
          ".word-left, .word-right",
          {
            autoAlpha: 1,
            display: "inline-block",
            duration: 1,
            ease: "power3.inOut",
          },
          `+=${HOLD}`,
        )
        .fromTo(
          ".word-title",
          { maxWidth: 0, x: 16, autoAlpha: 0 },
          {
            maxWidth: 600,
            x: 0,
            autoAlpha: 1,
            duration: 0.7,
            ease: "power3.out",
          },
          "<",
        )
        .to(
          ".word-title",
          { maxWidth: 0, autoAlpha: 0, duration: 1, ease: "power2.in" },
          `+=${HOLD}`,
        )
        // Loading wipes in from left as title wipes out — Mai/Hoa shift right via flex reflow.
        .fromTo(
          ".loading-wrapper",
          { maxWidth: 0, x: -16, autoAlpha: 0 },
          { maxWidth: 200, x: 0, autoAlpha: 1, duration: 0.7, ease: "power3.out" },
          ">",
        )

        // ----- Exit: slide whole overlay up -----
        .to(
          rootRef.current,
          {
            yPercent: -100,
            duration: 100,
            ease: "expo.inOut",
          },
          `+=${HOLD}`,
        );
    },
    { scope: rootRef, dependencies: [allRatiosReady] },
  );

  if (done) return null;

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-50 overflow-hidden bg-bg-primary"
    >
      <div className="stage stage-1 absolute inset-0 flex items-center justify-center">
        <div className="grid grid-cols-1">
          <div className="loading-wrapper w-15 sm:w-41.25 h-15 sm:h-41.25 relative max-w-0">
            <LoadingPathLoop
              repeat={-1}
              className="asterisk-loader absolute top-0 left-0 h-full w-full text-primary sm:h-41.25 sm:w-41.25"
            />
          </div>
          <div className="h-7 sm:hidden"></div>
        </div>
        <div className="sm:flex items-center sm:gap-6 text-[64px] sm:text-[200px] leading-none sm:leading-normal font-medium grid-cols-2 grid">
          <span className="word word-left relative hidden sm:inline-block text-center">
            Mai
          </span>

          <div
            ref={imgWrapRef}
            className="relative h-[clamp(216px,35vw,541px)] col-span-2"
          >
            {stage1Images.map((src, i) => (
              <img
                key={src}
                src={src}
                alt=""
                onLoad={(e) => {
                  const img = e.currentTarget;
                  const ratio = img.naturalWidth / img.naturalHeight;
                  setRatios((prev) => {
                    if (prev[i] === ratio) return prev;
                    const next = [...prev];
                    next[i] = ratio;
                    return next;
                  });
                }}
                className={`inline-img inline-img-${i} absolute inset-0 block h-full w-full object-cover`}
              />
            ))}
          </div>

          <span className="word word-right relative hidden sm:inline-block">
            Hoa
          </span>

          <div className="col-span-2 flex justify-end">
            <span className="word word-title text-base sm:text-4xl uppercase text-primary/70 font-accent max-w-0 overflow-hidden whitespace-nowrap ">
              [UIUX DESIGN]
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
