import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";
import { whyChooseCollage, whyChooseMetrics } from "../../../data/whyChooseMe";

gsap.registerPlugin(useGSAP, ScrollTrigger);

// A small world, in px and seconds. Gravity is well above earth's 9.8 m/s²
// because the band is only a few hundred px tall: at a realistic scale the
// pieces would drift down like feathers.
const GRAVITY = 2800;
const AIR_DRAG = 0.995;
const GROUND_BOUNCE = 0.28;
const WALL_BOUNCE = 0.4;
const PAIR_BOUNCE = 0.2;
const GROUND_FRICTION = 0.88;

// Fixed timestep, two per frame at 60Hz. Fixed rather than frame-timed so a
// dropped frame cannot hand the integrator a huge dt and let a piece pass
// straight through the floor.
const STEP = 1 / 120;
// Silent steps used to settle the pile when motion is not wanted — five
// seconds of world time, applied in one go and drawn once.
const SETTLE_STEPS = 600;
// Below this, in px/s, the pile counts as asleep and the ticker stands down.
const SLEEP_SPEED = 8;

// A click is an impulse, not a destination: how far its reach goes, how hard
// it shoves, and how much of that is upward so pieces pop rather than skid.
const KNOCK_RADIUS = 260;
const KNOCK_IMPULSE = 900;
const KNOCK_LIFT = 520;

// Discs have to stay legible where the band is narrow, so each piece has a floor under its share of the width.
const MIN_DISC_PX = 64;
const MIN_IMAGE_PX = 76;

// Longest the drop waits for the pictures to decode before starting anyway.
const DECODE_WAIT_MS = 1500;

export function WhyChooseMe() {
  const sectionRef = useRef<HTMLElement>(null);
  const bandRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLElement | null)[]>([]);

  useGSAP(
    () => {
      const section = sectionRef.current;
      const band = bandRef.current;
      const items = itemRefs.current.filter(
        (item): item is HTMLElement => item !== null,
      );
      if (!section || !band || items.length === 0) return;

      interface Body {
        el: HTMLElement;
        x: number;
        y: number;
        vx: number;
        vy: number;
        radius: number;
        mass: number;
        angle: number;
        spin: number;
      }

      let bodies: Body[] = [];
      let running = false;
      let hasDropped = false;
      let isActive = true;

      gsap.set(items, { autoAlpha: 0 });

      // Transforms are written straight to style rather than through GSAP: the
      // simulation already owns every position, and handing the same values to
      // a tween engine only adds bookkeeping. GSAP still does the fade, which
      // touches opacity alone and so cannot collide with this.
      const draw = () => {
        for (const body of bodies) {
          body.el.style.transform = `translate(-50%, -50%) translate(${body.x}px, ${body.y}px) rotate(${body.angle}deg)`;
        }
      };

      // How far the world reaches above the band — the band is only the floor
      // it settles on, the section is the room it falls through.
      const headroom = () =>
        Math.max(0, section.clientHeight - band.clientHeight);

      const step = (dt: number) => {
        const width = band.clientWidth;
        const height = band.clientHeight;
        const ceiling = -headroom();

        for (const body of bodies) {
          body.vy += GRAVITY * dt;
          body.vx *= AIR_DRAG;
          body.vy *= AIR_DRAG;
          body.x += body.vx * dt;
          body.y += body.vy * dt;

          if (body.x - body.radius < 0) {
            body.x = body.radius;
            body.vx = Math.abs(body.vx) * WALL_BOUNCE;
          } else if (body.x + body.radius > width) {
            body.x = width - body.radius;
            body.vx = -Math.abs(body.vx) * WALL_BOUNCE;
          }

          if (body.y - body.radius < ceiling) {
            body.y = ceiling + body.radius;
            body.vy = Math.abs(body.vy) * WALL_BOUNCE;
          } else if (body.y + body.radius > height) {
            body.y = height - body.radius;
            body.vy = -Math.abs(body.vy) * GROUND_BOUNCE;
            body.vx *= GROUND_FRICTION;
            // On the floor a piece rolls rather than skids, so its spin is the
            // speed it is travelling over its own radius.
            body.spin = (body.vx / body.radius) * (180 / Math.PI);
          }

          body.angle += body.spin * dt;
          body.spin *= AIR_DRAG;
        }

        // Thirteen pieces is seventy-eight pairs — cheap enough to test them
        // all rather than keep a spatial index in step with the pile.
        for (let i = 0; i < bodies.length; i += 1) {
          for (let j = i + 1; j < bodies.length; j += 1) {
            const a = bodies[i];
            const b = bodies[j];
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            const distance = Math.hypot(dx, dy) || 0.001;
            const overlap = a.radius + b.radius - distance;
            if (overlap <= 0) continue;

            const nx = dx / distance;
            const ny = dy / distance;
            const total = a.mass + b.mass;

            // Separated in inverse proportion to weight, so a small disc
            // landing on a big picture moves itself, not the picture.
            a.x -= nx * overlap * (b.mass / total);
            a.y -= ny * overlap * (b.mass / total);
            b.x += nx * overlap * (a.mass / total);
            b.y += ny * overlap * (a.mass / total);

            const closing = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
            if (closing >= 0) continue;

            const impulse =
              (-(1 + PAIR_BOUNCE) * closing) / (1 / a.mass + 1 / b.mass);
            a.vx -= (impulse * nx) / a.mass;
            a.vy -= (impulse * ny) / a.mass;
            b.vx += (impulse * nx) / b.mass;
            b.vy += (impulse * ny) / b.mass;
          }
        }

        return bodies.some(
          (body) => Math.hypot(body.vx, body.vy) > SLEEP_SPEED,
        );
      };

      // Declarations, not consts: tick and stop refer to each other.
      function tick() {
        const movedFirst = step(STEP);
        const movedSecond = step(STEP);
        draw();
        if (!movedFirst && !movedSecond) stop();
      }

      function start() {
        if (running || !isActive) return;
        running = true;
        gsap.ticker.add(tick);
      }

      function stop() {
        if (!running) return;
        running = false;
        gsap.ticker.remove(tick);
      }

      const build = (fromAbove: boolean) => {
        const width = band.clientWidth;
        const height = band.clientHeight;

        bodies = items.map((el, index) => {
          const spec = whyChooseCollage[index];
          const radius = el.offsetWidth / 2;
          // Given a lane apiece rather than a random x: pure random clusters,
          // and a cluster released together just builds a tower in one spot
          // instead of a row along the floor.
          const lane = ((index + 0.5) / items.length) * width;
          return {
            el,
            x: gsap.utils.clamp(
              radius,
              Math.max(radius, width - radius),
              lane + gsap.utils.random(-width * 0.04, width * 0.04),
            ),
            // Released level with the top of the section and spread down a
            // little, so they arrive in waves with room to roll apart rather
            // than landing as one sheet.
            y: fromAbove
              ? -headroom() + radius + gsap.utils.random(0, headroom() * 0.35)
              : gsap.utils.random(radius, Math.max(radius, height - radius)),
            vx: 0,
            vy: 0,
            radius,
            // Weight follows area, so the big pictures push the small discs
            // around rather than the other way about.
            mass: radius * radius,
            angle: spec?.kind === "image" ? (spec.rotation ?? 0) : 0,
            spin: 0,
          };
        });
      };

      const onPointerDown = (event: PointerEvent) => {
        // Nothing here wants the browser's own response to a press on an image
        // or a run of text.
        event.preventDefault();
        const rect = band.getBoundingClientRect();
        const pointerX = event.clientX - rect.left;
        const pointerY = event.clientY - rect.top;

        for (const body of bodies) {
          const dx = body.x - pointerX;
          const dy = body.y - pointerY;
          const distance = Math.hypot(dx, dy);
          const force = Math.max(0, 1 - distance / KNOCK_RADIUS);
          if (force <= 0) continue;

          // A hit dead on a piece's centre has no direction to give, and would
          // otherwise be an atan2 of two zeroes.
          const angle =
            distance < 1
              ? gsap.utils.random(0, Math.PI * 2)
              : Math.atan2(dy, dx);

          body.vx += Math.cos(angle) * force * KNOCK_IMPULSE;
          body.vy += Math.sin(angle) * force * KNOCK_IMPULSE;
          body.vy -= force * KNOCK_LIFT;
          body.spin += gsap.utils.random(-260, 260) * force;
        }

        start();
      };

      // Only reacts to a real change of size. Unguarded, this fires on the
      // layout that ScrollTrigger.refresh() itself forces, which calls refresh
      // again — and every refresh is a chance to move the scroll position,
      // which a mandatory snap then finishes by jumping to the next section.
      let bandWidth = band.clientWidth;
      let bandHeight = band.clientHeight;

      const resizeObserver = new ResizeObserver(() => {
        if (!hasDropped) return;
        const width = band.clientWidth;
        const height = band.clientHeight;
        if (width === bandWidth && height === bandHeight) return;
        bandWidth = width;
        bandHeight = height;
        for (const body of bodies) {
          body.radius = body.el.offsetWidth / 2;
          body.mass = body.radius * body.radius;
          body.x = gsap.utils.clamp(
            body.radius,
            Math.max(body.radius, width - body.radius),
            body.x,
          );
          body.y = gsap.utils.clamp(
            body.radius,
            Math.max(body.radius, height - body.radius),
            body.y,
          );
        }
        // Gravity re-settles the pile into the new box on its own.
        start();
        ScrollTrigger.refresh();
      });
      resizeObserver.observe(band);

      band.addEventListener("pointerdown", onPointerDown);

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        hasDropped = true;
        build(false);
        for (let i = 0; i < SETTLE_STEPS; i += 1) step(STEP);
        draw();
        gsap.set(items, { autoAlpha: 1 });
        return () => {
          isActive = false;
          resizeObserver.disconnect();
          band.removeEventListener("pointerdown", onPointerDown);
        };
      }

      const trigger = ScrollTrigger.create({
        trigger: section,
        start: "top 70%",
        once: true,
        onEnter: async () => {
          await Promise.race([
            Promise.all(
              items
                .filter((item): item is HTMLImageElement => "decode" in item)
                .map((image) => image.decode().catch(() => undefined)),
            ),
            new Promise((resolve) => setTimeout(resolve, DECODE_WAIT_MS)),
          ]);
          if (!isActive) return;
          hasDropped = true;
          build(true);
          draw();
          gsap.to(items, { autoAlpha: 1, duration: 0.2, stagger: 0.04 });
          start();
        },
      });

      return () => {
        isActive = false;
        stop();
        resizeObserver.disconnect();
        trigger.kill();
        band.removeEventListener("pointerdown", onPointerDown);
      };
    },
    { scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      id="why-choose-me"
      aria-labelledby="why-choose-title"
      className="relative flex min-h-dvh w-full flex-col overflow-hidden bg-secondary px-4 pt-[9.5dvh] pb-[220px] sm:px-8 lg:px-[4.48vw] lg:pb-0 lg:pt-[15vh]"
    >
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
              className="flex flex-col gap-3 border-t border-line py-[2.5dvh] lg:gap-3.5 lg:py-12"
            >
              <dt className="font-display text-[clamp(34px,5.6dvh,52px)] leading-none text-primary lg:text-[80px]">
                {metric.value}
              </dt>
              <dd className="max-w-42 font-accent text-[14px] uppercase leading-[1.2] text-primary/70 lg:max-w-60 lg:text-base">
                {metric.label}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Figma 717:3848: the collage lives in a band across the bottom 45% of the frame, inside the page gutters. Pieces are sized as fractions of it and scattered at random across it, so the arrangement scales with the section instead of piling into one row. Below lg the content runs taller than a viewport, so the band flows after the metrics instead of pinning over them. */}
      <div
        ref={bandRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[min(400px,55dvh)] lg:inset-x-[4.48vw] lg:h-[44.6%]"
      >
        {whyChooseCollage.map((item, index) =>
          item.kind === "disc" ? (
            <span
              key={item.key}
              ref={(node) => {
                itemRefs.current[index] = node;
              }}
              style={{
                opacity: 0,
                width: `max(${item.width * 100}%, ${MIN_DISC_PX}px)`,
              }}
              className="pointer-events-auto absolute left-0 top-0 flex aspect-square cursor-pointer items-center justify-center rounded-full bg-white px-3 text-center font-accent text-[10px] uppercase leading-[1.2] text-[#1d1d1d] select-none sm:text-xs lg:text-base"
            >
              {item.label}
            </span>
          ) : (
            <img
              key={item.key}
              ref={(node) => {
                itemRefs.current[index] = node;
              }}
              src={item.src}
              alt=""
              width={item.imageWidth}
              height={item.imageHeight}
              loading="lazy"
              decoding="async"
              // Without this the same press that knocks a piece also starts a
              // native image drag, leaving a ghost trailing the cursor.
              draggable={false}
              style={{
                opacity: 0,
                width: `max(${item.width * 100}%, ${MIN_IMAGE_PX}px)`,
              }}
              className="pointer-events-auto absolute left-0 top-0 h-auto cursor-pointer object-contain select-none"
            />
          ),
        )}
      </div>
    </section>
  );
}
