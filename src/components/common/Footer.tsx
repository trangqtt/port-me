import { navItems } from "../../data/navigation";
import { profile } from "../../data/profile";

export function Footer() {
  return (
    <footer
      id="footer"
      className="relative flex min-h-dvh w-full flex-col overflow-hidden bg-primary px-4 pt-8 sm:px-8 lg:px-[4.48vw] lg:pt-11"
    >
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
        {/* <picture> ensures the browser fetches only the image for the active breakpoint. */}
        <picture>
          <source
            media="(min-width: 1024px)"
            srcSet="/images/footer-portrait.png"
          />
          <img
            src="/images/footer-portrait-mobile.png"
            alt=""
            aria-hidden="true"
            width={600}
            height={382}
            loading="lazy"
            decoding="async"
            className="pointer-events-none absolute left-1/2 z-0 w-100 max-w-none object-cover -translate-x-1/2 -translate-y-3/4 lg:w-360 lg:-translate-x-3/5 lg:-translate-y-90"
          />
        </picture>
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
          className="pointer-events-none relative z-10 flex items-center justify-between overflow-hidden whitespace-nowrap font-accent text-[clamp(3.25rem,20vw,11.9rem)] leading-[0.7] font-bold uppercase text-primary/50 lg:text-[clamp(6rem,19.9vw,400px)]"
        >
          {/* Matches the Figma wordmark exactly — "Hoa" set with a zero glyph. */}
          <span>Mai</span>
          <span>H0a</span>
        </div>
      </div>
    </footer>
  );
}
