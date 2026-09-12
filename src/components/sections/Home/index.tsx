import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { profile } from "../../../data/profile";
import { useImageCycleRandom } from "../../../hooks/useImageCycleRandom";
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
    <section
      id="home"
      aria-label={`${profile.name} — home`}
      className="relative w-full min-h-dvh overflow-hidden bg-primary px-5 pt-25 pb-20 sm:px-8 lg:px-[4.48vw] lg:pt-0 lg:pb-0"
    >
      <div className="relative z-10 flex flex-col gap-17 lg:block lg:aspect-1920/1080 lg:w-full min-h-screen">
        <div className="flex flex-col gap-4 lg:contents">
          <div className="flex flex-col font-display leading-none lg:absolute lg:left-[56.25%] lg:top-[26.11%]">
            <span className="text-[32px] font-medium text-primary md:text-6xl xl:text-[80px] lg:tracking-[-1.6px]">
              @{profile.name}
            </span>
            <span className="text-2xl font-medium text-primary/70 md:text-6xl xl:text-[80px] lg:tracking-[-1.6px]">
              {profile.role}
            </span>
          </div>
          <p className="max-w-75 md:w-[25.5%] font-accent text-sm uppercase leading-[1.2] text-primary/70 lg:absolute md:left-0 xl:left-[4.01%] lg:top-[27.11%] 2xl:w-[15.57%] lg:max-w-none lg:text-base">
            Passionate about creating unforgettable and beautiful digital
            experiences.
          </p>
        </div>

        <div className="relative lg:contents">
          <div
            ref={imageCycleRef}
            role="img"
            aria-label={`${profile.name} — portrait`}
            className="relative aspect-2/3 w-[calc(100%-40px)] lg:absolute lg:left-[calc(25%+45px)] lg:top-[26.39%] lg:h-[42.96%] lg:w-auto"
          >
            {cycleImages.map((src, index) => (
              <img
                key={`${src}-${index}`}
                src={src}
                alt=""
                aria-hidden="true"
                width={600}
                height={900}
                loading={index === 0 ? "eager" : "lazy"}
                decoding="async"
                fetchPriority={index === 0 ? "high" : "auto"}
                data-image-cycle-card
                className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain"
              />
            ))}
          </div>
          <a
            href="#work"
            aria-label="Explore work"
            className="absolute -bottom-8 right-0 flex size-25 items-center justify-center rounded-full bg-secondary text-center font-accent text-base uppercase leading-[1.2] text-primary transition-colors hover:bg-accent lg:top-auto lg:right-auto lg:left-[56.25%] lg:bottom-[30.19%] lg:size-37.5"
          >
            <span aria-hidden="true" className="lg:hidden">
              Explore
              <br />
              work
            </span>
            <span aria-hidden="true" className="hidden lg:inline">
              Explore work
            </span>
          </a>
        </div>

        <div className="items-end gap-2 font-accent text-base uppercase text-primary/70 absolute left-0 right-0 bottom-0">
          <div className="flex justify-between font-accent text-sm uppercase leading-[1.2] text-primary/70 lg:text-base">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              {profile.socials.map((social, index) => (
                <span key={social.label} className="flex items-center gap-2">
                  {index > 0 && <span aria-hidden="true">/</span>}
                  <ScrambleLink
                    text={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className={"transition-colors hover:text-primary"}
                  />
                </span>
              ))}
            </div>
            <span aria-hidden="true" className="hidden lg:flex">
              {" "}
              @2026
            </span>
            <span aria-hidden="true" className="hidden lg:flex">
              {" "}
              Scroll more [→]
            </span>
          </div>
          <p
            aria-hidden="true"
            className="pointer-events-none relative overflow-hidden whitespace-nowrap font-accent text-[clamp(3.25rem,20vw,11.9rem)] leading-none font-bold uppercase text-primary/50  lg:text-center lg:text-[clamp(6rem,9.9vw,11.875rem)]"
          >
            @01UIUXDesigner
          </p>
        </div>
      </div>
    </section>
  );
}
