import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { useLenis } from "lenis/react";
import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import { useImageCycleRandom } from "../../../hooks/useImageCycleRandom";
import { markIntroDone } from "../../../hooks/useIntroDone";
import { useIsMobile } from "../../../hooks/useIsMobile";

gsap.registerPlugin(useGSAP);

const DEFAULT_IMAGES = [
  "/images/intro-1.png",
  "/images/intro-2.png",
  "/images/intro-3.png",
] as const;

// Seconds of cycling before the final panel arrives (~1 image every 0.34s).
const CYCLE_HOLD = 1;

// One block per letter so the overflow-hidden wrapper can mask a staggered slide-up; split per word since a space collapses as a flex item.
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
  const lenis = useLenis();
  // `lenis` is undefined on first render; a ref keeps it out of the useGSAP deps, which would otherwise rebuild the timeline mid-intro.
  const lenisRef = useRef(lenis);
  lenisRef.current = lenis;
  const isMobile = useIsMobile();

  const rootRef = useRef<HTMLDivElement>(null);
  const introStartRef = useRef<HTMLSpanElement>(null);
  const introEndRef = useRef<HTMLSpanElement>(null);
  const imageBoxRef = useRef<HTMLSpanElement>(null);
  const growingImageRef = useRef<HTMLSpanElement>(null);
  const textGroupRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const roleLabelRef = useRef<HTMLParagraphElement>(null);
  const slotFrameRef = useRef<HTMLSpanElement>(null);
  const finalPanelRef = useRef<HTMLSpanElement>(null);
  const imageLoopRef = useRef<gsap.core.Timeline | null>(null);
  const { addImageCycleInfiniteSequence, cycleImages, imageCycleRef } =
    useImageCycleRandom(DEFAULT_IMAGES);

  useEffect(() => {
    if (done) return;

    const root = document.documentElement;
    const body = document.body;
    const previousRootOverflow = root.style.overflow;
    const previousBodyOverflow = body.style.overflow;
    const previousOverscrollBehavior = root.style.overscrollBehavior;
    const previousTouchAction = body.style.touchAction;

    lenis?.stop();
    root.style.overflow = "hidden";
    body.style.overflow = "hidden";
    root.style.overscrollBehavior = "none";
    body.style.touchAction = "none";

    return () => {
      root.style.overflow = previousRootOverflow;
      body.style.overflow = previousBodyOverflow;
      root.style.overscrollBehavior = previousOverscrollBehavior;
      body.style.touchAction = previousTouchAction;
      lenis?.start();
    };
  }, [done, lenis]);

  useGSAP(
    () => {
      const root = rootRef.current;

      if (!root) return;

      const finishIntro = () => {
        lenisRef.current?.scrollTo(0, { immediate: true, force: true });
        window.scrollTo(0, 0);
        // Releases the hero, which has been holding its content hidden.
        markIntroDone();
        setDone(true);
      };

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        finishIntro();
        return;
      }

      const letters = root.querySelectorAll("[data-intro-letter]");

      const timeline = gsap.timeline({
        defaults: { ease: "expo.inOut" },
        onComplete: finishIntro,
      });

      timeline
        .set(root, { autoAlpha: 1 })
        .set(growingImageRef.current, { xPercent: -50, yPercent: -50 })
        .set(finalPanelRef.current, { scale: 0 })
        .set(roleLabelRef.current, { autoAlpha: 0, width: 0 });

      // The slot sits between words of unequal width, so it is (Mai - Hoa) / 2 off centre; read late so a webfont swap cannot bake in a stale number.
      const slotRecentre = () =>
        ((introEndRef.current?.getBoundingClientRect().width ?? 0) -
          (introStartRef.current?.getBoundingClientRect().width ?? 0)) /
        2;

      let groupShift = 0;
      const measureGroupShift = () => {
        const heading = headingRef.current;
        const label = roleLabelRef.current;
        if (!heading || !label) return;
        // The label is at width 0 here; borrow its natural width to measure.
        const previousWidth = label.style.width;
        label.style.width = "auto";
        const name = heading.getBoundingClientRect();
        const role = label.getBoundingClientRect();
        label.style.width = previousWidth;
        const left = Math.min(name.left, role.left);
        const right = Math.max(name.right, role.right);
        groupShift = window.innerWidth / 2 - (left + right) / 2;
      };

      // Step 1: the name reveals behind its word masks, the label opens beside it and the pair slides to centre; fromTo throughout so a rebuild never reads a mid-flight transform.
      timeline
        .fromTo(
          letters,
          { yPercent: 100 },
          { yPercent: 0, duration: 1.25, stagger: 0.025 },
        )
        .add(measureGroupShift, ">-=0.2")
        .to(
          roleLabelRef.current,
          { autoAlpha: 1, width: "auto", duration: 0.8, ease: "expo.out" },
          "<",
        )
        .to(
          textGroupRef.current,
          { x: () => groupShift, duration: 0.8, ease: "expo.out" },
          "<",
        )
        // Collapses the way it opened; the name reclaims the centre as it goes.
        .to(
          roleLabelRef.current,
          { autoAlpha: 0, width: 0, duration: 0.5, ease: "expo.in" },
          ">+=0.4",
        )
        .to(
          textGroupRef.current,
          { x: 0, duration: 0.5, ease: "expo.in" },
          "<",
        );

      // Step 2: the slot parts the words; a phone has no room for a 430px slot, so there the name leaves first and the photo takes its place.
      if (isMobile) {
        timeline
          .to(
            [introStartRef.current, introEndRef.current],
            { autoAlpha: 0, duration: 0.5, ease: "power2.out" },
            ">",
          )
          // Hidden words keep their footprint; re-centre before it is seen.
          .set(growingImageRef.current, { x: slotRecentre })
          .fromTo(
            growingImageRef.current,
            { width: "0%" },
            { width: "100%", duration: 1.25 },
            ">",
          )
          .addLabel("imageCycle", ">");
      } else {
        timeline
          .fromTo(
            imageBoxRef.current,
            { width: "0em" },
            {
              // Read, not restated, so the narrow-screen max-w is honoured.
              width: () =>
                slotFrameRef.current?.getBoundingClientRect().width ?? 0,
              duration: 1.25,
            },
            ">",
          )
          .fromTo(
            growingImageRef.current,
            { width: "0%" },
            { width: "100%", duration: 1.25 },
            "<",
          )
          .fromTo(
            introStartRef.current,
            { x: "0em" },
            { x: "-0.05em", duration: 1.25 },
            "<",
          )
          .fromTo(
            introEndRef.current,
            { x: "0em" },
            { x: "0.05em", duration: 1.25 },
            "<",
          )
          .addLabel("imageCycle", ">");
      }

      // The cycle runs on its own timeline: a repeat:-1 child would make the main timeline infinite and never reach the final panel.
      timeline
        .add(() => {
          imageLoopRef.current?.kill();
          const loop = gsap.timeline();
          addImageCycleInfiniteSequence(loop);
          imageLoopRef.current = loop;
        }, "imageCycle")
        .addLabel("imageCycleEnd", `imageCycle+=${CYCLE_HOLD}`)
        .add(() => {
          imageLoopRef.current?.kill();
          imageLoopRef.current = null;
        }, "imageCycleEnd");

      // Nothing cuts the slot to black at imageCycleEnd: the last photo must stay up so the panel grows over it in view, not black on black.

      // How far past scale 1 the panel must go to fill the screen; read late since the slot is viewport-sized and off centre by (Hoa - Mai) / 2, so it over-covers by twice that.
      const panelCoverScale = () => {
        const frame = slotFrameRef.current;
        const rect = frame?.getBoundingClientRect();
        if (!rect?.width || !rect.height) return 1;
        const offset = Math.abs(slotRecentre());
        return Math.max(
          (window.innerWidth + 2 * offset) / rect.width,
          window.innerHeight / rect.height,
        );
      };

      // Step 3a: the panel arrives as one more card, scale 0 to the photo's bounds on the cycle's own spawn curve, so it reads as the last frame.
      timeline.to(
        finalPanelRef.current,
        { scale: 1, duration: 0.55, ease: "power3.out" },
        "imageCycleEnd",
      );

      // Step 3b — the same box keeps going until it owns the screen.
      timeline.to(
        finalPanelRef.current,
        { scale: panelCoverScale, duration: 1, ease: "expo.in" },
        ">+=0.06",
      );

      // Step 4: the full-screen panel is the hero's own background, so no fade or wipe; a beat on black, then `finishIntro` unmounts it.
      timeline.to({}, { duration: 0.12 });

      return () => {
        imageLoopRef.current?.kill();
        imageLoopRef.current = null;
        timeline.kill();
      };
    },
    { scope: rootRef, dependencies: [isMobile], revertOnUpdate: true },
  );

  if (done) return null;

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-bg-secondary"
    >
      {/* Later cycle frames spawn as lazy clones 0.34s apart, too late to fetch; React hoists these preloads to <head> so they are warm by the first switch. */}
      {cycleImages.slice(1).map((src) => (
        <link key={src} rel="preload" as="image" href={src} />
      ))}

      {/* The h1 is the only centred element, so the slot lands on viewport centre once the box grows past 100vw; the label hangs off it so it never drags that centre. */}
      <div
        ref={textGroupRef}
        className="relative flex items-center justify-center"
      >
        {/* leading-[1.3] is the Figma value and what the masks need: a line shorter than the glyphs crops them at rest and yPercent:100 fails to clear them. */}
        <h1
          ref={headingRef}
          aria-label="Mai Hoa"
          className="flex items-center justify-center whitespace-nowrap font-display text-[clamp(64px,16vw,200px)] font-medium leading-[1]"
        >
          <span
            ref={introStartRef}
            aria-hidden="true"
            className="relative z-10 flex justify-end overflow-hidden px-[0.06em]"
          >
            {splitWord("Mai")}
          </span>

          {/* Zero-width flex item, so widening it parts the words; its contents are absolute, so growth never reflows the line. */}
          <span
            ref={imageBoxRef}
            aria-hidden="true"
            style={{ "--slot-w": "min(430px, 55vw)" } as CSSProperties}
            className="relative w-0 shrink-0 self-stretch"
          >
            <span
              ref={slotFrameRef}
              className="absolute left-1/2 top-1/2 h-[calc(var(--slot-w)*500/430)] w-(--slot-w) -translate-x-1/2 -translate-y-1/2"
            >
              <span
                ref={growingImageRef}
                className="absolute left-1/2 top-1/2 h-full w-0 overflow-hidden"
              >
                {/* Fills the clip so it covers a full-bleed one and matches the page background, so the final panel is seamless. */}
                <span className="pointer-events-none absolute inset-0 block bg-primary" />

                {/* Matches the frame's ratio so the clip reveals the photo instead of squashing it; also the pool the cycle clones into. */}
                <span
                  ref={imageCycleRef}
                  className="absolute left-1/2 top-1/2 h-full w-(--slot-w) -translate-x-1/2 -translate-y-1/2"
                >
                  <img
                    src={cycleImages[0]}
                    alt=""
                    aria-hidden="true"
                    width={430}
                    height={500}
                    loading="eager"
                    decoding="async"
                    fetchPriority="high"
                    data-image-cycle-card
                    className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
                  />
                </span>
              </span>
            </span>

            <span
              ref={finalPanelRef}
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-1/2 z-20 h-[calc(var(--slot-w)*500/430)] w-(--slot-w) -translate-x-1/2 -translate-y-1/2 bg-primary"
            />
          </span>

          <span
            ref={introEndRef}
            aria-hidden="true"
            className="relative z-10 flex justify-start overflow-hidden px-[0.06em]"
          >
            {splitWord("Hoa")}
          </span>
        </h1>

        <p
          ref={roleLabelRef}
          className="absolute right-0 top-full inline-block overflow-hidden whitespace-nowrap font-accent text-base uppercase leading-[1.2] text-primary/70 sm:left-full sm:right-auto sm:top-1/2 sm:ml-3 sm:-translate-y-1/2 sm:text-[32px]"
        >
          [UIUX DESIGN]
        </p>
      </div>
    </div>
  );
}
