import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { useLenis } from "lenis/react";
import { useEffect, useRef, useState } from "react";
import { useIsMobile } from "../../../hooks/useIsMobile";

gsap.registerPlugin(useGSAP);

const DEFAULT_IMAGES = [
  "/images/intro-1.png",
  "/images/intro-2.png",
  "/images/intro-3.png",
] as const;

// One block per letter so the word's overflow-hidden wrapper can mask a
// staggered slide-up. Split a word at a time: a space would collapse to
// nothing as a flex item.
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
  // ReactLenis publishes its instance from an effect, so `lenis` is undefined
  // on the first render. Reading it through a ref keeps it out of the useGSAP
  // dependencies, which would otherwise rebuild the timeline mid-intro.
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
  const imageStackRef = useRef<HTMLSpanElement>(null);

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
        setDone(true);
      };

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        finishIntro();
        return;
      }

      const letters = root.querySelectorAll("[data-intro-letter]");
      const photos = root.querySelectorAll("[data-intro-photo]");

      const timeline = gsap.timeline({
        defaults: { ease: "expo.inOut" },
        onComplete: finishIntro,
      });

      timeline
        .set(root, { autoAlpha: 1 })
        .set(growingImageRef.current, { xPercent: -50, yPercent: -50 })
        .set(roleLabelRef.current, { autoAlpha: 0, width: 0 });

      // The label hangs off the heading instead of sharing its flex row, so
      // the heading alone is what the page centres — that is what lets the
      // full-bleed panel land dead centre later without measuring. The cost is
      // that an open label sticks out to one side, so the group is centred by
      // sliding the whole thing instead. Measured off the real boxes, so the
      // stacked mobile layout (label below, nothing to offset) yields ~0.
      // The slot sits between two words of unequal width, so it is
      // (Mai - Hoa) / 2 off the h1's centre — a constant, since the box grows
      // symmetrically. Read late so a webfont swap can't bake in a stale
      // number; the words still report geometry once autoAlpha hides them.
      const slotRecentre = () =>
        ((introEndRef.current?.getBoundingClientRect().width ?? 0) -
          (introStartRef.current?.getBoundingClientRect().width ?? 0)) /
        2;

      let groupShift = 0;
      const measureGroupShift = () => {
        const heading = headingRef.current;
        const label = roleLabelRef.current;
        if (!heading || !label) return;
        // The label is mid-collapse at width 0 here; borrow its natural width
        // to measure. autoAlpha only hides it, so it still has geometry.
        const previousWidth = label.style.width;
        label.style.width = "auto";
        const name = heading.getBoundingClientRect();
        const role = label.getBoundingClientRect();
        label.style.width = previousWidth;
        const left = Math.min(name.left, role.left);
        const right = Math.max(name.right, role.right);
        groupShift = window.innerWidth / 2 - (left + right) / 2;
      };

      // Step 1 — the name reveals behind its word masks. The label then opens
      // beside it, the pair sliding into centre together; it holds, closes,
      // and the name slides back to dead centre on its own. fromTo throughout,
      // never from: `from` reads the element's current state as its end value,
      // so any rebuilt timeline would capture a mid-flight transform and
      // settle the letters off their baseline.
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
        // Collapses back the way it opened, and the name reclaims the centre
        // as it goes, so it is alone and centred before the slot appears.
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

      // Step 2 — only once the label is gone does the image arrive. A phone
      // has no room to part a 430px slot between the words without shoving
      // them off both edges, so there the name leaves first and the photo
      // takes the space it vacated.
      if (isMobile) {
        timeline
          .to(
            [introStartRef.current, introEndRef.current],
            { autoAlpha: 0, duration: 0.5, ease: "power2.out" },
            ">",
          )
          // The words keep their footprint while hidden, so the slot is still
          // parked off-centre between them. Nudge it before it is ever seen.
          .set(growingImageRef.current, { x: slotRecentre })
          .fromTo(
            growingImageRef.current,
            { width: "0%" },
            { width: "100%", duration: 1.25 },
            ">",
          )
          .addLabel("imageFlip", "-=0.05");
      } else {
        timeline
          .fromTo(
            imageBoxRef.current,
            { width: "0em" },
            {
              // Open to exactly the frame's width, so the parting words leave
              // the photo's own footprint behind. Read rather than restated,
              // so the narrow-screen max-w is honoured too.
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
          .addLabel("imageFlip", "-=0.05");
      }

      // Hard cuts, not crossfades: each cover is dropped in a single frame so
      // the slot flips through the stack down to the black panel.
      timeline.fromTo(
        photos,
        { autoAlpha: 1 },
        { autoAlpha: 0, duration: 0.05, ease: "none", stagger: 0.5 },
        "imageFlip",
      );

      // Step 3 — the black panel left behind by the flip takes the screen.
      // Growing the box past the viewport shoves the name off both edges, and
      // because the h1 is the only thing being centred the panel lands dead
      // centre without measuring anything.
      timeline
        .to(
          growingImageRef.current,
          {
            width: "100vw",
            height: "100dvh",
            x: slotRecentre,
            duration: 2,
          },
          "imageFlip+=1.25",
        )
        .to(imageBoxRef.current, { width: "110vw", duration: 2 }, "<");

      // Step 4 — the screen is solid black by now, so the overlay lifts off it
      // and the page underneath fades up out of the dark.
      timeline.to(
        root,
        { autoAlpha: 0, duration: 0.6, ease: "power2.out" },
        ">+=0.2",
      );

      return () => timeline.kill();
    },
    { scope: rootRef, dependencies: [isMobile], revertOnUpdate: true },
  );

  if (done) return null;

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-bg-secondary"
    >
      {/* The h1 is the only centred element, so the slot inside it sits on the
          viewport centre once the box grows past 100vw. The role label is
          positioned off it rather than sharing a flex row, which would drag
          that centre sideways; while the label is open the group is centred by
          shifting this wrapper instead. */}
      <div
        ref={textGroupRef}
        className="relative flex items-center justify-center"
      >
        <h1
          ref={headingRef}
          aria-label="Mai Hoa"
          className="flex items-center justify-center whitespace-nowrap font-display text-[clamp(64px,16vw,200px)] font-medium leading-[0.75]"
        >
          <span
            ref={introStartRef}
            aria-hidden="true"
            className="flex justify-end overflow-hidden px-[0.06em]"
          >
            {splitWord("Mai")}
          </span>

          {/* Zero-width flex item, so widening it pushes the words apart.
              Everything inside is absolute, so the frame can stand taller than
              the line without stretching it, and the clip's full-bleed growth
              never reflows anything. */}
          <span
            ref={imageBoxRef}
            aria-hidden="true"
            className="relative w-0 shrink-0 self-stretch"
          >
            {/* The photo's own 430x500, so it is shown whole and unscaled.
                max-w only bites on screens too narrow to hold it. */}
            <span
              ref={slotFrameRef}
              className="absolute left-1/2 top-1/2 aspect-430/500 w-107.5 max-w-[55vw] -translate-x-1/2 -translate-y-1/2"
            >
              <span
                ref={growingImageRef}
                className="absolute left-1/2 top-1/2 h-full w-0 overflow-hidden"
              >
                {/* Fills the clip at every size, so it still covers the
                    viewport once the clip goes full-bleed. */}
                <span className="pointer-events-none absolute inset-0 block bg-black" />

                {/* Matches the frame's ratio, so the photo holds still at its
                    true proportions while the clip opens over it — a reveal,
                    not a squash, and nothing cropped. */}
                <span
                  ref={imageStackRef}
                  className="absolute left-1/2 top-1/2 aspect-430/500 h-full -translate-x-1/2 -translate-y-1/2"
                >
                  {/* Stacked front-to-back so cutting them in DOM order plays
                      as a flip through the deck. Cut away one by one, they
                      leave the black panel behind. */}
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
                      fetchPriority={index === 0 ? "high" : "auto"}
                      data-intro-photo
                      className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
                      style={{ zIndex: DEFAULT_IMAGES.length - index }}
                    />
                  ))}
                </span>
              </span>
            </span>
          </span>

          <span
            ref={introEndRef}
            aria-hidden="true"
            className="flex justify-start overflow-hidden px-[0.06em]"
          >
            {splitWord("Hoa")}
          </span>
        </h1>

        <p
          ref={roleLabelRef}
          className="absolute right-0 top-full inline-block overflow-hidden whitespace-nowrap font-accent text-base uppercase leading-none text-primary/70 sm:bottom-0 sm:left-full sm:right-auto sm:top-auto sm:ml-3 sm:text-4xl"
        >
          [UIUX DESIGN]
        </p>
      </div>
    </div>
  );
}
