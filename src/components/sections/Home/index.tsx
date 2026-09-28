import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { profile } from "../../../data/profile";
import type { CSSProperties } from "react";
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

  // `autoPlay` keeps the loop going on phones that refuse a scripted play(), so reduced motion is applied after the fact by pausing at frame zero, which leaves the poster.
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

  // Blocks reveal only once the intro is done; hidden from JS rather than a class, so a no-JS or errored page still renders a complete hero.
  // useGSAP(
  //   () => {
  //     // Scoped explicitly: useGSAP's `scope` only reaches selector text passed
  //     // to gsap methods, not to toArray, which would otherwise search the
  //     // whole document.
  //     const blocks = gsap.utils.toArray<HTMLElement>(
  //       "[data-hero-reveal]",
  //       sectionRef.current,
  //     );
  //     if (!blocks.length) return;

  //     if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  //       gsap.set(blocks, { clearProps: "opacity,visibility,transform" });
  //       return;
  //     }

  //     if (!introDone) {
  //       gsap.set(blocks, { autoAlpha: 0, y: 28 });
  //       return;
  //     }

  //     // Reads top-left to bottom-right in DOM order, so the stagger walks the
  //     // hero the way it is read.
  //     gsap.to(blocks, {
  //       autoAlpha: 1,
  //       y: 0,
  //       duration: 0.9,
  //       ease: "expo.out",
  //       stagger: 0.09,
  //     });
  //   },
  //   { scope: sectionRef, dependencies: [introDone] },
  // );

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
    // Every child is absolute, so the section is one viewport tall and Figma offsets read straight off it; `isolate` keeps the render's blend inside the section.
    <section
      ref={sectionRef}
      id="home"
      aria-label={`${profile.name} — home`}
      // The paragraph and the photo share one right-hand column in the design, declared once here so px and % anchors cannot drift apart.
      style={
        {
          "--hero-col-right": "7.81%",
          "--hero-col-w": "299px",
        } as CSSProperties
      }
      className="relative isolate min-h-dvh w-full overflow-hidden bg-primary"
    >
      {/* Later cycle frames spawn as lazy clones too late to fetch; React hoists these preloads to <head> so they are warm by the first switch. */}
      {cycleImages.slice(1).map((src) => (
        <link key={src} rel="preload" as="image" href={src} />
      ))}

      {/* The render is a near-black plate; `difference` against the near-black page dissolves its edges, and it paints first so the blend never touches the copy. */}
      <div
        data-hero-reveal
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-[-40%] right-[-44.5%] top-[330px] mix-blend-difference lg:bottom-auto lg:left-[10%] lg:right-auto lg:top-[14.17%] lg:h-[90%] lg:w-[79.62%]"
      >
        {/* The poster is the render's first frame, so the plate blends correctly before any video decodes and stays when the loop is suppressed. */}
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
          // `contain` on the phone, where negative insets make a box far wider than 16:9; empty bands cost nothing since `difference` against the same near-black resolves to background.
          className="h-full w-full select-none object-contain lg:object-cover"
        />
      </div>

      {/* Photo card: the design crops a 2:3 portrait to a squarer window biased towards the head, hence the object-position. */}
      <div
        ref={imageCycleRef}
        data-hero-reveal
        role="img"
        aria-label={`${profile.name} — portrait`}
        className="absolute left-[4.33%] top-[108px] aspect-[202/221] w-[22.84%] overflow-hidden lg:left-[calc(100%-var(--hero-col-right)-var(--hero-col-w))] lg:right-auto lg:top-[49.17%] lg:w-[10.54%]"
      >
        {/* Only the first frame is mounted; every later switch is spawned by the cycle hook. */}
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

      {/* Stacked and right-aligned on the phone, one slash-separated row along the bottom on desktop, so separators only exist there. */}
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

      {/* The phone has no room for the header's contact button, so the call to action moves under the paragraph. */}
      <div
        data-hero-reveal
        className="absolute left-4 top-60.25 flex w-(--hero-col-w) max-w-[calc(100%-2rem)] flex-col gap-2.5 font-accent text-sm uppercase leading-[1.2] lg:left-auto lg:right-(--hero-col-right) lg:top-[33.8%] lg:max-w-none lg:text-base"
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

      {/* Desktop says the name here in Neue Montreal; the phone says it in the wordmark below, so only one is ever mounted. */}
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

      {/* Zero-height anchor on the bottom edge: the collage is laid out in `em`, so one font-size keeps the words' overlaps at every width. */}
      <div
        aria-hidden="true"
        // Sized purely in vw with no ceiling: every offset is in em, so the collage scales as one shape; a px cap stranded the wordmark left on mid-width screens.
        className="pointer-events-none absolute inset-x-0 bottom-0 font-wordmark text-[18.3vw] font-bold uppercase leading-none text-primary lg:hidden"
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
        {/* Inside the collage on the phone, out on the left margin on desktop, so the two year marks cannot be one element; both are decorative. */}
        <span className="absolute bottom-[0.875em] left-[2.5em]">
          <span
            data-hero-reveal
            className="block font-accent text-base font-normal text-primary/70"
          >
            2026
          </span>
        </span>
      </div>

      {/* Teko is condensed enough to stay inside the viewport at this size, and it hangs below the fold exactly as the frame clips it. */}
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
