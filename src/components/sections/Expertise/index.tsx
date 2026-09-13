import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { useRef } from "react";

gsap.registerPlugin(useGSAP);

const FLAIR_IMAGES = [
  "/images/expertise-1.png",
  "/images/expertise-2.png",
  "/images/expertise-3.png",
  "/images/expertise-4.png",
  "/images/expertise-1.png",
  "/images/expertise-2.png",
  "/images/expertise-3.png",
  "/images/expertise-4.png",
  "/images/expertise-1.png",
  "/images/expertise-2.png",
  "/images/expertise-3.png",
  "/images/expertise-4.png",
] as const;

// Cursor travel (px) required between spawns of the next trailing image.
const SPAWN_GAP = 90;

// "Flair cursor follower" pattern: https://codepen.io/GreenSock/pen/WbbEGmp
export function Expertise() {
  const sectionRef = useRef<HTMLElement>(null);
  const flairRefs = useRef<(HTMLImageElement | null)[]>([]);

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const wrapIndex = gsap.utils.wrap(0, FLAIR_IMAGES.length);
      let spawnIndex = 0;
      let lastPos = { x: 0, y: 0 };
      let hasLastPos = false;
      let pendingPoint: { x: number; y: number } | null = null;
      let rafId: number | null = null;

      const playPop = (image: HTMLImageElement) => {
        const timeline = gsap.timeline();
        timeline
          .from(image, {
            opacity: 0,
            scale: 0,
            duration: 0.6,
            ease: "elastic.out(1,0.3)",
          })
          .to(
            image,
            { rotation: gsap.utils.random(-25, 25), duration: 0.6 },
            "<",
          )
          .to(image, {
            y: section.clientHeight * 0.6,
            opacity: 0,
            ease: "back.in(0.4)",
            duration: 1,
          });
      };

      const spawnFlair = (x: number, y: number) => {
        const image = flairRefs.current[wrapIndex(spawnIndex)];
        if (!image) return;
        gsap.killTweensOf(image);
        gsap.set(image, { clearProps: "all" });
        gsap.set(image, {
          opacity: 1,
          left: x,
          top: y,
          xPercent: -50,
          yPercent: -50,
        });
        playPop(image);
        spawnIndex += 1;
      };

      const handlePoint = (point: { x: number; y: number }) => {
        if (!hasLastPos) {
          lastPos = point;
          hasLastPos = true;
          return;
        }

        const travel = Math.hypot(lastPos.x - point.x, lastPos.y - point.y);
        if (travel > SPAWN_GAP) {
          spawnFlair(point.x, point.y);
          lastPos = point;
        }
      };

      const flushPointerMove = () => {
        rafId = null;
        if (pendingPoint) handlePoint(pendingPoint);
      };

      const onPointerMove = (event: PointerEvent) => {
        const rect = section.getBoundingClientRect();
        pendingPoint = {
          x: event.clientX - rect.left,
          y: event.clientY - rect.top,
        };

        if (rafId === null) {
          rafId = window.requestAnimationFrame(flushPointerMove);
        }
      };

      section.addEventListener("pointermove", onPointerMove);
      return () => {
        section.removeEventListener("pointermove", onPointerMove);
        if (rafId !== null) window.cancelAnimationFrame(rafId);
      };
    },
    { scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      id="expertise"
      aria-label="My expertise"
      className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-primary px-5 py-24 sm:px-8"
    >
      <h2 className="relative z-10 whitespace-nowrap text-center font-display text-[15vw] leading-[1.3] text-primary sm:text-[13vw] lg:text-[10.5vw] 2xl:text-[200px]">
        My expertise
      </h2>

      <img
        src="/images/expertise-3d.png"
        alt=""
        aria-hidden="true"
        width={403}
        height={504}
        loading="lazy"
        decoding="async"
        className="pointer-events-none absolute left-1/2 top-1/2 z-20 h-[70vw] w-[56vw] max-h-135 max-w-108 translate-x-[-44%] -translate-y-1/2 object-cover sm:h-[45vw] sm:w-[36vw]"
      />

      {FLAIR_IMAGES.map((src, index) => (
        <img
          key={`${src}-${index}`}
          ref={(node) => {
            flairRefs.current[index] = node;
          }}
          src={src}
          alt=""
          aria-hidden="true"
          width={160}
          height={120}
          loading="lazy"
          decoding="async"
          className="pointer-events-none absolute left-0 top-0 z-30 block h-24 w-32 object-cover opacity-0 lg:h-30 lg:w-40"
        />
      ))}
    </section>
  );
}
