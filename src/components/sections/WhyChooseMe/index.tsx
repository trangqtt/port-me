import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";
import { whyChooseMetrics } from "../../../data/whyChooseMe";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const DROP_IMAGES = [
  { src: "/images/why-choose-me-1.png", width: 600, height: 600 },
  { src: "/images/why-choose-me-2.png", width: 600, height: 600 },
  { src: "/images/why-choose-me-3.png", width: 600, height: 600 },
  { src: "/images/why-choose-me-4.png", width: 600, height: 600 },
  { src: "/images/why-choose-me-5.png", width: 600, height: 600 },
  { src: "/images/why-choose-me-6.png", width: 600, height: 600 },
  { src: "/images/why-choose-me-7.webp", width: 1264, height: 1060 },
  { src: "/images/why-choose-me-8.webp", width: 1008, height: 1008 },
  { src: "/images/why-choose-me-9.png", width: 1, height: 1 },
  { src: "/images/why-choose-me-10.webp", width: 768, height: 772 },
  { src: "/images/why-choose-me-11.webp", width: 704, height: 712 },
  { src: "/images/why-choose-me-12.webp", width: 736, height: 744 },
  { src: "/images/why-choose-me-13.webp", width: 716, height: 724 },
] as const;

export function WhyChooseMe() {
  const sectionRef = useRef<HTMLElement>(null);
  const dropImageRefs = useRef<(HTMLImageElement | null)[]>([]);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const images = dropImageRefs.current.filter(
        (image): image is HTMLImageElement => image !== null,
      );

      if (!section || images.length === 0) return;

      gsap.set(images, { autoAlpha: 0 });
      let hasSettled = false;
      let isActive = true;

      const settleImages = (animate: boolean) => {
        images.forEach((image, index) => {
          const imageWidth = image.offsetWidth;
          const imageHeight = image.offsetHeight;
          const edgePadding = imageWidth / 2;
          const landingX = gsap.utils.random(
            edgePadding,
            Math.max(edgePadding, section.clientWidth - edgePadding),
          );
          const landingY =
            section.clientHeight -
            imageHeight / 2 -
            gsap.utils.random(0, Math.min(120, section.clientHeight * 0.12));
          const rotation = gsap.utils.random(-28, 28);

          if (!animate) {
            gsap.set(image, {
              autoAlpha: 1,
              x: landingX,
              y: landingY,
              xPercent: -50,
              yPercent: -50,
              rotation,
            });
            return;
          }

          gsap.fromTo(
            image,
            {
              autoAlpha: 0,
              x: landingX + gsap.utils.random(-40, 40),
              y: gsap.utils.random(-180, -80),
              xPercent: -50,
              yPercent: -50,
              rotation: gsap.utils.random(-90, 90),
            },
            {
              autoAlpha: 1,
              x: landingX,
              y: landingY,
              rotation,
              duration: gsap.utils.random(1.4, 2.1),
              delay: index * 0.08,
              ease: "bounce.out",
            },
          );
        });
      };

      const resizeObserver = new ResizeObserver(() => {
        if (!hasSettled) return;
        gsap.killTweensOf(images);
        settleImages(false);
        ScrollTrigger.refresh();
      });

      resizeObserver.observe(section);

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        hasSettled = true;
        settleImages(false);
        return () => resizeObserver.disconnect();
      }

      const trigger = ScrollTrigger.create({
        trigger: section,
        start: "top 70%",
        once: true,
        onEnter: async () => {
          await Promise.all(
            images.map((image) => image.decode().catch(() => undefined)),
          );
          if (!isActive) return;
          hasSettled = true;
          settleImages(true);
        },
      });

      return () => {
        isActive = false;
        resizeObserver.disconnect();
        trigger.kill();
      };
    },
    { scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      id="why-choose-me"
      aria-labelledby="why-choose-title"
      className="relative flex min-h-dvh w-full flex-col overflow-hidden bg-[#0d0d0d] px-5 py-16 sm:px-8 lg:px-[4.48vw] lg:pb-0 lg:pt-[15vh]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10"
      >
        {DROP_IMAGES.map((image, index) => (
          <img
            key={image.src}
            ref={(node) => {
              dropImageRefs.current[index] = node;
            }}
            src={image.src}
            alt=""
            width={image.width}
            height={image.height}
            loading="lazy"
            decoding="async"
            style={{ opacity: 0 }}
            className="absolute left-0 top-0 size-20 object-contain sm:size-24 lg:size-32"
          />
        ))}
      </div>

      <div className="relative z-20 flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(18rem,1fr)_minmax(35rem,1.38fr)] lg:gap-[8vw]">
        <header className="flex flex-col gap-2 lg:gap-7.5">
          <p className="font-accent text-sm uppercase leading-[1.2] text-primary/70 lg:text-base">
            [Why choose me]
          </p>
          <h2
            id="why-choose-title"
            className="font-display text-[26px] leading-none text-primary sm:text-[40px] lg:text-[52px]"
          >
            Why choose me
          </h2>
        </header>

        <dl className="lg:grid grid-cols-2 gap-x-14 lg:gap-x-30">
          {whyChooseMetrics.map((metric) => (
            <div
              key={metric.value}
              className="flex min-h-32 flex-col gap-3.5 border-t border-line py-6 lg:min-h-0 lg:py-12"
            >
              <dt className="font-display text-[52px] leading-none text-primary lg:text-[80px]">
                {metric.value}
              </dt>
              <dd className="max-w-42 font-accent text-[14px] uppercase leading-[1.2] text-primary/70 lg:max-w-60 lg:text-base">
                {metric.label}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
