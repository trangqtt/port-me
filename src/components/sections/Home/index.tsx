import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { profile } from "../../../data/profile";
import { useEffect, useRef } from "react";
import { useImageCycleRandom } from "../../../hooks/useImageCycleRandom";
import { useIntroDone } from "../../../hooks/useIntroDone";
import { ScrambleLink } from "../../ui/ScrambleLink";

gsap.registerPlugin(useGSAP);

const HERO_IMAGES = [
  "/images/hero-cycle-1.jpg",
  "/images/hero-cycle-2.jpg",
  "/images/hero-cycle-3.jpg",
  "/images/hero-cycle-4.jpg",
] as const;

export function Home() {
  const { addImageCycleInfiniteSequence, cycleImages, imageCycleRef } =
    useImageCycleRandom(HERO_IMAGES);
  const sectionRef = useRef<HTMLElement>(null);
  const renderRef = useRef<HTMLVideoElement>(null);
  const introDone = useIntroDone();

  // `autoPlay` is the attribute the browser honours before React ever runs,
  // which is what keeps the loop going on the phones that refuse a scripted
  // play(). Suppressing it therefore has to happen after the fact: pausing
  // back to frame zero leaves exactly the poster on screen, so the plate is
  // identical to the still hero it replaced.
  useEffect(() => {
    const render = renderRef.current;
    if (!render) return;

    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      if (query.matches) {
        render.pause();
        render.currentTime = 0;
      } else {
        void render.play().catch(() => {});
      }
    };

    apply();
    query.addEventListener("change", apply);
    return () => {
      query.removeEventListener("change", apply);
    };
  }, []);

  // The blocks come in only once the intro is out of the way. They are hidden
  // from here rather than from a class, so markup that never runs this — no
  // JS, a thrown error — still renders a complete hero instead of a blank
  // one. The overlay covers the screen while it happens, so the first paint
  // is never seen.
  useGSAP(
    () => {
      // Scoped explicitly: useGSAP's `scope` only reaches selector text passed
      // to gsap methods, not to toArray, which would otherwise search the
      // whole document.
      const blocks = gsap.utils.toArray<HTMLElement>(
        "[data-hero-reveal]",
        sectionRef.current,
      );
      if (!blocks.length) return;

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(blocks, { clearProps: "opacity,visibility,transform" });
        return;
      }

      if (!introDone) {
        gsap.set(blocks, { autoAlpha: 0, y: 28 });
        return;
      }

      // Reads top-left to bottom-right in DOM order, so the stagger walks the
      // hero the way it is read.
      gsap.to(blocks, {
        autoAlpha: 1,
        y: 0,
        duration: 0.9,
        ease: "expo.out",
        stagger: 0.09,
      });
    },
    { scope: sectionRef, dependencies: [introDone] },
  );

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }
      const timeline = gsap.timeline();
      addImageCycleInfiniteSequence(timeline);
      return () => {
        timeline.kill();
      };
    },
    { scope: imageCycleRef },
  );

  return (
    // Every child is absolute, so the section is exactly one viewport tall and
    // the design's coordinates can be read straight off it. The header is
    // `fixed`, so these offsets are measured from the top of the page the same
    // way the Figma frame measures them. `isolate` keeps the render's blend
    // from reaching past the section to whatever the page paints underneath.
    <section
      ref={sectionRef}
      id="home"
      aria-label={`${profile.name} — home`}
      className="relative isolate min-h-dvh w-full overflow-hidden bg-primary"
    >
      {/* The cycle spawns its later frames as lazy clones a third of a second
          apart, far too late to start fetching them then. React hoists these
          to <head>, so they are warm by the time the first switch lands. */}
      {cycleImages.slice(1).map((src) => (
        <link key={src} rel="preload" as="image" href={src} />
      ))}

      {/* The render is a near-black plate, and `difference` against the page's
          own near-black is what dissolves its edges into the background while
          leaving the lit figure. It is painted before everything else so the
          blend only ever sees the section's background, never the copy. */}
      <div
        data-hero-reveal
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-[-71.8%] right-[-44.5%] top-[330px] mix-blend-difference lg:bottom-auto lg:left-[5.47%] lg:right-auto lg:top-[14.17%] lg:h-[90%] lg:w-[79.62%]"
      >
        {/* The poster is the render's first frame, so the plate is already
            blending correctly before a byte of video has decoded, and it is
            what stays on screen when the loop is suppressed. */}
        <video
          ref={renderRef}
          src="/videos/hero-3d.mp4"
          poster="/images/hero-3d.webp"
          width={1280}
          height={720}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          disablePictureInPicture
          tabIndex={-1}
          className="h-full w-full select-none object-cover"
        />
      </div>

      {/* Photo card. The design crops a 2:3 portrait to a squarer window
          biased towards the head, which is what the object-position buys. */}
      <div
        ref={imageCycleRef}
        data-hero-reveal
        role="img"
        aria-label={`${profile.name} — portrait`}
        className="absolute left-[4.33%] top-[108px] aspect-[202/221] w-[22.84%] overflow-hidden lg:left-auto lg:right-[12.43%] lg:top-[49.17%] lg:w-[10.54%]"
      >
        {/* Only the first frame is mounted; every switch after it is the
            cycle's, spawned by the hook. */}
        <img
          src={cycleImages[0]}
          alt=""
          aria-hidden="true"
          width={600}
          height={900}
          loading="eager"
          decoding="async"
          fetchPriority="high"
          data-image-cycle-card
          className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover object-[50%_14%]"
        />
      </div>

      <p
        data-hero-reveal
        aria-hidden="true"
        className="absolute right-3 top-[98px] font-accent text-base uppercase leading-[1.2] text-primary/70 lg:left-[4.01%] lg:right-auto lg:top-[26.4%]"
      >
        [→]
      </p>

      {/* Stacked and right-aligned on the phone, a single slash-separated row
          along the bottom on desktop — so the separators only exist there. */}
      <div
        data-hero-reveal
        className="absolute right-[4.33%] top-[155px] flex flex-col items-end font-accent text-sm uppercase leading-[1.2] text-primary/70 lg:bottom-[17.96%] lg:left-[4.17%] lg:right-auto lg:top-auto lg:flex-row lg:items-center lg:gap-2 lg:text-base"
      >
        {profile.socials.map((social, index) => (
          <span key={social.label} className="flex items-center gap-2">
            {index > 0 && (
              <span aria-hidden="true" className="hidden lg:inline">
                /
              </span>
            )}
            <ScrambleLink
              text={social.label}
              href={social.href}
              target="_blank"
              rel="noreferrer noopener"
              className={
                index === 0
                  ? "text-primary transition-colors hover:text-accent"
                  : "transition-colors hover:text-primary"
              }
            />
          </span>
        ))}
      </div>

      {/* The phone has no room for the header's contact button, so the design
          moves that call to action under the paragraph instead. */}
      <div
        data-hero-reveal
        className="absolute left-4 top-[241px] flex w-[299px] max-w-[calc(100%-2rem)] flex-col gap-2.5 font-accent text-sm uppercase leading-[1.2] lg:left-auto lg:right-[7.81%] lg:top-[33.8%] lg:max-w-none lg:text-base"
      >
        <p className="text-primary/70">
          Passionate about creating unforgettable and beautiful digital
          experiences.
        </p>
        <a
          href={`mailto:${profile.email}`}
          className="text-primary transition-colors hover:text-accent lg:hidden"
        >
          Get in touch
        </a>
      </div>

      {/* Desktop says the name in Neue Montreal beside the render; the phone
          says it in the wordmark below instead, so only one is ever mounted. */}
      <div
        data-hero-reveal
        className="absolute left-[3.7%] top-[33.8%] hidden flex-col font-display text-[4.167vw] leading-none tracking-[-0.02em] lg:flex"
      >
        <span className="text-primary">@{profile.name}</span>
        <span className="text-primary/70">{profile.role}</span>
      </div>

      <p
        data-hero-reveal
        aria-hidden="true"
        className="absolute left-[3.91%] top-[67.87%] hidden font-accent text-base uppercase leading-[1.2] text-primary/70 lg:block"
      >
        2026
      </p>

      <p
        data-hero-reveal
        aria-hidden="true"
        className="absolute bottom-[17.96%] left-[56.62%] hidden font-accent text-base uppercase leading-[1.2] text-primary/70 lg:block"
      >
        @2026
      </p>

      <div
        data-hero-reveal
        className="absolute bottom-[18.15%] right-[3.91%] hidden items-end gap-2 font-accent text-base uppercase leading-[1.2] text-primary/70 lg:flex"
      >
        <span>Scroll more</span>
        <span aria-hidden="true">[→]</span>
      </div>

      {/* A zero-height anchor on the bottom edge: the collage is laid out in
          `em`, so one font-size governs the whole arrangement and the words
          keep their overlaps at every width instead of drifting apart. The
          cap freezes that scale once the viewport outgrows a phone. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 font-wordmark text-[min(18.3vw,88px)] font-bold uppercase leading-none text-primary lg:hidden"
      >
        <span
          data-hero-reveal
          className="absolute bottom-[1.125em] left-[0.3056em]"
        >
          {profile.name}
        </span>
        <span
          data-hero-reveal
          className="absolute bottom-[0.4306em] left-[0.3056em]"
        >
          UIUX
        </span>
        <span
          data-hero-reveal
          className="absolute bottom-[-0.25em] left-[1.4861em]"
        >
          Designer
        </span>
        <span data-hero-reveal className="absolute bottom-[0.5em] left-[3.5139em]">
          @01
        </span>
        {/* Sits inside the collage on the phone and out on the left margin on
            desktop, so the two year marks cannot be one element. Both are
            decorative, which is what makes saying it twice free. */}
        <span className="absolute bottom-[0.875em] left-[2.5em]">
          <span
            data-hero-reveal
            className="block font-accent text-base font-normal text-primary/70"
          >
            2026
          </span>
        </span>
      </div>

      {/* Teko is condensed enough that the line stays just inside the viewport
          at this size, so it needs no fitting. It hangs below the fold by a
          fraction of its own size, exactly as the frame clips it. */}
      <p
        data-hero-reveal
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-[-0.2385em] hidden whitespace-nowrap text-center font-wordmark text-[13.542vw] font-bold uppercase leading-none text-primary/60 lg:block"
      >
        @01UIUXDesigner
      </p>
    </section>
  );
}
