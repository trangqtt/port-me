import { useEffect, useRef } from "react";
import { navItems } from "../../data/navigation";
import { profile } from "../../data/profile";

// How quickly the playhead closes on where the scroll says it should be. A
// straight assignment makes every wheel tick a hard seek and the picture
// stutters; easing turns a flick into a glide.
const SCRUB_EASE = 0.12;
// Below this, in seconds, the playhead is close enough — seeking costs a
// decode, so it is not worth spending one on a difference nobody can see.
const SCRUB_EPSILON = 1 / 60;
// The stretch of the clip the scroll is spent over, in seconds. Only this
// window is used: the opening second is dropped and everything past 4s is left
// unplayed, so the whole track maps onto the stretch worth having.
const SCRUB_START = 1;
const SCRUB_END = 3.8;

// How far below its opening the wordmark parks, as a percentage of its own
// height. Not 100: the type is set at `leading-[0.7]`, so the line box is
// shorter than the letters standing in it and they overhang it by roughly
// 0.15em at each end. A 100% shift moves the box clear but leaves the tops of
// the letters inside the opening, so the wordmark is never fully away and has
// nothing to rise from.
const WORDMARK_TRAVEL = 130;

export function Footer() {
  const footerRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const wordmarkRef = useRef<HTMLDivElement>(null);

  // The footer's own progress through the viewport drives the playhead: 0 as
  // its top reaches the bottom of the screen, 1 once its bottom has left the
  // top. Read from the element each frame rather than from a scroll event, so
  // it stays correct under Lenis's smoothing, which moves the page between
  // events.
  useEffect(() => {
    const footer = footerRef.current;
    const video = videoRef.current;
    if (!footer || !video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let primed = false;

    const tick = () => {
      frame = requestAnimationFrame(tick);

      // `isFinite`, not `isNaN`: an mp4 whose metadata the browser has not
      // fully parsed reports Infinity, which passes an isNaN check and then
      // puts the target beyond any reachable time, so the playhead sits still
      // and the clip looks stuck a fraction of the way in.
      const { duration } = video;
      if (!Number.isFinite(duration) || duration <= 0) return;

      // The footer is a track two viewports tall with its contents pinned to
      // the top of it, so the distance it can travel while pinned is its own
      // height less one screen. 0 is the moment it pins, 1 the moment it lets
      // go — the same span the video and the wordmark are both spent over.
      const rect = footer.getBoundingClientRect();
      const travel = Math.max(1, rect.height - window.innerHeight);
      const progress = Math.min(1, Math.max(0, -rect.top / travel));

      // Travels up out of its own mask: 100% of its height is exactly one
      // wordmark below the opening, so it starts out of sight and lands on its
      // line at 1. Moved rather than uncovered, so the letters rise instead of
      // a window opening over them.
      const wordmark = wordmarkRef.current;
      if (wordmark) {
        wordmark.style.transform = `translateY(${(1 - progress) * WORDMARK_TRAVEL}%)`;
      }

      // Both ends are held inside the clip that actually loaded, so a shorter
      // file than expected scrubs over what it has rather than seeking past
      // its own end and sticking on the last frame it can reach.
      const end = Math.min(SCRUB_END, duration);
      const start = Math.min(SCRUB_START, end);
      const target = start + progress * (end - start);

      // The very first frame is placed, not eased towards. Easing from the
      // video's own 0 would play through the opening second on the way to it,
      // which is the second being dropped.
      if (!primed) {
        primed = true;
        video.currentTime = target;
        return;
      }

      // Easing is asymptotic, so the last sliver of the clip would never
      // arrive: it closes on the end without reaching it, and the final frames
      // are never shown. At the ends of the track the playhead is placed.
      if (progress >= 0.999 || progress <= 0.001) {
        if (Math.abs(target - video.currentTime) > SCRUB_EPSILON) {
          video.currentTime = target;
        }
        return;
      }

      const next =
        video.currentTime + (target - video.currentTime) * SCRUB_EASE;
      if (Math.abs(next - video.currentTime) > SCRUB_EPSILON) {
        video.currentTime = next;
      }
    };

    // Only runs while the footer is on screen; a permanent rAF loop would seek
    // a video nobody is looking at for the whole length of the page.
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        if (!frame) frame = requestAnimationFrame(tick);
      } else if (frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    });
    observer.observe(footer);

    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    // Two viewports tall, but only one of them is ever shown: the second is
    // the scroll the pinned stage is spent against.
    <footer
      ref={footerRef}
      id="footer"
      // Two viewports, so the snap gets a second point one viewport in — the
      // end of the track. Without it the only target inside this span is its
      // own start, and a mandatory snap reaching the end has nowhere to land
      // but back up there.
      data-snap-steps="2"
      className="relative h-[200dvh] w-full bg-primary"
    >
      <div className="sticky top-0 isolate flex h-dvh w-full flex-col overflow-hidden px-4 pt-8 sm:px-8 lg:px-[4.48vw] lg:pt-11">
        {/* The footer's backdrop, filling the pinned stage. `isolate` on the
            stage is what lets a negative z-index work here: it puts the video
            behind everything in the stage without also putting it behind the
            footer's own background, which is painted outside this context.

            Scrubbed, not played: no autoplay and no loop, because the scroll
            position is the transport. `preload="auto"` matters more than usual
            — seeking into a range the browser has not buffered shows nothing,
            and the whole point is that every scroll position has a frame. The
            poster covers the wait. */}
        <video
          ref={videoRef}
          src="/videos/footer-portrait.mp4"
          poster="/images/footer-portrait.png"
          aria-hidden="true"
          width={600}
          height={382}
          muted
          playsInline
          preload="auto"
          disablePictureInPicture
          tabIndex={-1}
          // Figma 642:4209 sizes the render rather than bleeding it: 1439x915 on a
          // 1920x1080 frame, centred on 46.88% and dropped 385 from the top. Stated
          // as percentages so it keeps that share of the stage at any size.
          className="pointer-events-none absolute -bottom-[30%] left-[46.88%] -z-10 h-[84.72%] w-[120dvh] lg:w-[74.95%] -translate-x-1/2 object-contain lg:bottom-auto lg:top-[35.65%]"
        />

        <nav
          aria-label="Footer"
          className="order-1 flex items-center justify-between font-accent text-sm uppercase text-primary lg:text-base"
        >
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-accent"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="order-2 mt-16 flex flex-col gap-8 lg:mt-24 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col items-start gap-8 lg:max-w-137.5">
            <div className="flex flex-col lg:flex-row gap-2 lg:gap-4 lg:w-[40dvw] justify-between">
              <p className="font-accent text-sm uppercase leading-[1.2] text-primary/70 min-w-49">
                [Have a crazy idea?]
              </p>
              <p className="font-display text-[32px] leading-none text-primary underline decoration-solid [text-underline-position:from-font] lg:text-[52px] max-w-100">
                Let&apos;s talk about your project
              </p>
            </div>

            {/* Mobile design omits the circle CTA — desktop only. */}
            <a
              href={`mailto:${profile.email}`}
              className="hidden size-25 shrink-0 items-center justify-center rounded-full bg-secondary text-center font-accent text-sm uppercase leading-[1.2] text-primary transition-colors hover:bg-accent lg:flex lg:size-37.5 lg:text-base"
            >
              Get in
              <br />
              touch
            </a>
          </div>

          <div className="flex flex-col gap-4 lg:grid lg:grid-cols-2 lg:gap-x-8 lg:gap-y-8 lg:w-162.5">
            <div className="flex flex-col gap-2 lg:gap-3">
              <p className="font-accent text-sm uppercase text-primary/70">
                Email
              </p>
              <a
                href={`mailto:${profile.email}`}
                className="font-display text-base text-primary transition-colors hover:text-accent lg:text-xl font-medium"
              >
                {profile.email}
              </a>
            </div>
            <div className="flex flex-col gap-2 lg:gap-3">
              <p className="font-accent text-sm uppercase text-primary/70">
                Phone
              </p>
              <a
                href={`tel:${profile.phone.replace(/\s+/g, "")}`}
                className="font-display text-base text-primary transition-colors hover:text-accent lg:text-xl font-medium"
              >
                {profile.phone}
              </a>
            </div>

            <div className="flex flex-col gap-2 lg:gap-3">
              <p className="font-accent text-sm uppercase text-primary/70">
                Social
              </p>
              <div className="flex flex-wrap items-center gap-2 lg:gap-3 font-medium">
                {profile.socials.map((social, index) => (
                  <span
                    key={social.label}
                    className="flex items-center gap-2 lg:gap-3"
                  >
                    {index > 0 && (
                      <span
                        aria-hidden="true"
                        className="font-accent text-sm text-primary/70"
                      >
                        /
                      </span>
                    )}
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="font-display text-base text-primary transition-colors hover:text-accent lg:text-xl"
                    >
                      {social.label}
                    </a>
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-2 lg:gap-3">
              <p className="font-accent text-sm uppercase text-primary/70">
                Address
              </p>
              <p className="font-display text-base text-primary lg:text-xl font-medium">
                10a Nhat Chi Mai Street, Ward 13, Tan Binh District, HCM
              </p>
            </div>
          </div>
        </div>

        {/* Mobile: copyright sits right after contact info. Desktop: after the giant name. */}
        <div className="order-3 mt-10 flex items-center justify-between gap-4 font-accent text-sm uppercase text-primary/70 lg:hidden">
          <div className="flex items-center gap-4">
            <span>©2026</span>
            <span>Copyright</span>
          </div>
          <span>All rights reserved.</span>
        </div>

        <div className="relative order-4 mt-auto lg:order-3 lg:pt-20">
          <div className="flex justify-between font-accent text-base uppercase text-primary/70">
            <div className="hidden lg:flex items-center justify-between gap-30">
              <div className="flex items-center gap-4">
                <span>©2026</span>
                <span>Copyright</span>
              </div>
              <span>All rights reserved.</span>
            </div>
            <a
              href="#home"
              className="text-right hidden lg:block transition-colors hover:text-accent"
            >
              Back to top [→]
            </a>
          </div>

          <div
            aria-hidden="true"
            className="pointer-events-none relative z-10 overflow-hidden whitespace-nowrap font-wordmark text-[clamp(3.25rem,20vw,11.9rem)] leading-none font-bold uppercase text-primary/50 lg:text-[clamp(6rem,19.9vw,400px)]"
          >
            {/* Two boxes: the one above is the opening the letters rise
                through, and holds the type size so this one's 100% is exactly
                one wordmark tall. */}
            <div
              ref={wordmarkRef}
              // Parked one full height down; the scroll walks it up. Inline
              // rather than a class so the first paint matches frame zero.
              style={{ transform: `translateY(${WORDMARK_TRAVEL}%)` }}
              className="flex items-center justify-between"
            >
              {/* Matches the Figma wordmark exactly — "Hoa" set with a zero glyph. */}
              <span>Mai</span>
              <span>H0a</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
