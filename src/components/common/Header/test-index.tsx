import { useLenis } from "lenis/react";
import type { Transition, Variants } from "motion/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useId, useState } from "react";
import { navItems } from "../../../data/navigation";
import { profile } from "../../../data/profile";
import { AsteriskMark } from "../../Icon/AsteriskMark";


const CURTAIN_EASE = [0.83, 0, 0.17, 1] as const; // expo.inOut
const CURTAIN_DURATION = 0.75;

function MenuDotsIcon({ className }: { className?: string }) {
  const positions = [1.5, 6, 10.5];
  return (
    <svg
      viewBox="0 0 12 12"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={className}
    >
      {positions.flatMap((cy) =>
        positions.map((cx) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={0.9} />
        )),
      )}
    </svg>
  );
}

function ArrowUpRightIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={className}
    >
      <path d="M4 12L12 4" />
      <path d="M5.5 4H12V10.5" />
    </svg>
  );
}

export function NavBar() {
  const [open, setOpen] = useState(false);
  const lenis = useLenis();
  const panelId = useId();

  const close = useCallback(() => setOpen(false), []);

  // Lock scroll while the menu is open. Lenis wraps native scrolling, so we
  // stop the instance AND set `overflow: hidden` on the html element to catch
  // touch/keyboard scrolling that would otherwise bleed through.
  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const previousOverflow = html.style.overflow;
    html.style.overflow = "hidden";
    lenis?.stop();
    return () => {
      html.style.overflow = previousOverflow;
      lenis?.start();
    };
  }, [open, lenis]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <TopBar
        open={open}
        onToggle={() => setOpen((v) => !v)}
        panelId={panelId}
      />
      <AnimatePresence>
        {open && <MenuPanel id={panelId} onClose={close} />}
      </AnimatePresence>
    </>
  );
}

interface TopBarProps {
  open: boolean;
  onToggle: () => void;
  panelId: string;
}

function TopBar({ open, onToggle, panelId }: TopBarProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-40 flex items-center justify-between px-6 py-4 md:px-10 md:py-5">
      <a
        href="#top"
        aria-label={`${profile.name} — back to top`}
        className="group inline-flex items-center gap-2 text-primary transition-opacity hover:opacity-80"
      >
        <AsteriskMark className="h-6 w-6 text-primary transition-transform duration-500 ease-out group-hover:rotate-45" />
        <span className="font-display text-lg font-medium leading-none tracking-tight">
          {profile.name}
        </span>
      </a>

      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? "Close menu" : "Open menu"}
        className="group relative inline-flex items-center gap-2 rounded-sm border border-line/60 bg-primary/5 px-3 py-2 font-accent text-[11px] uppercase tracking-[0.2em] text-primary backdrop-blur-sm transition-colors hover:border-accent/60 hover:text-accent"
      >
        <MenuDotsIcon className="h-3 w-3 transition-colors group-hover:text-accent" />
        <span>{open ? "Close" : "Menu"}</span>
      </button>
    </header>
  );
}

interface MenuPanelProps {
  id: string;
  onClose: () => void;
}

function MenuPanel({ id, onClose }: MenuPanelProps) {
  const reduce = useReducedMotion();

  // Users who opt out of motion get an instant cross-fade instead of the
  // curtain drop — same information, no vestibular payload.
  const panelTransition: Transition | undefined = reduce
    ? { duration: 0.15 }
    : undefined;

  return (
    <motion.div
      id={id}
      role="dialog"
      aria-modal="true"
      aria-label="Site navigation"
      className="fixed inset-0 z-50 overflow-y-auto bg-bg-primary text-primary"
      initial={reduce ? { opacity: 0 } : "hidden"}
      animate={reduce ? { opacity: 1 } : "visible"}
      exit={reduce ? { opacity: 0 } : "exit"}
      transition={panelTransition}
      variants={reduce ? undefined : curtainVariants}
    >
      <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-6 py-4 md:px-10 md:py-5">
        {/* Panel header — mirrors the top bar so switching between the two
            states feels like a single surface, not two competing layers. */}
        <div className="flex items-center justify-between">
          <a
            href="#top"
            onClick={onClose}
            aria-label={`${profile.name} — back to top`}
            className="inline-flex items-center gap-2 text-primary"
          >
            <AsteriskMark className="h-6 w-6 text-primary" />
            <span className="sr-only">{profile.name}</span>
          </a>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="group inline-flex items-center gap-2 rounded-sm border border-line/60 bg-primary/5 px-3 py-2 font-accent text-[11px] uppercase tracking-[0.2em] text-primary transition-colors hover:border-accent/60 hover:text-accent"
          >
            <span>Close</span>
            <span
              aria-hidden
              className="text-primary/60 group-hover:text-accent"
            >
              [x]
            </span>
          </button>
        </div>

        {/* Nav list. `motion.ul` stages the stagger; each `motion.li` slides
            in from below the curtain edge. */}
        <motion.ul
          className="mt-16 flex flex-col gap-3 md:mt-24"
          variants={reduce ? undefined : itemListVariants}
          initial={reduce ? false : "hidden"}
          animate={reduce ? undefined : "visible"}
          exit={reduce ? undefined : "exit"}
        >
          {navItems.map((item) => (
            <motion.li
              key={item.href}
              variants={reduce ? undefined : itemVariants}
              className="border-b border-line/40"
            >
              <a
                href={item.href}
                onClick={onClose}
                className="group flex w-full max-w-md items-baseline justify-between py-2 text-primary transition-colors duration-300 hover:text-accent"
              >
                <span className="font-display text-5xl font-medium leading-[1.05] tracking-tight md:text-6xl">
                  {item.label}
                </span>
                <span className="font-accent text-xs text-primary/50 transition-colors group-hover:text-accent">
                  [{item.index}]
                </span>
              </a>
            </motion.li>
          ))}
        </motion.ul>

        {/* Contact block — Space Mono micro-labels sit above display-font
            values, echoing the type contrast used throughout the site. */}
        <motion.div
          className="mt-auto grid grid-cols-1 gap-8 pt-16 sm:grid-cols-2 md:pt-24"
          initial={reduce ? false : { opacity: 0, y: 20 }}
          animate={reduce ? undefined : { opacity: 1, y: 0 }}
          transition={
            reduce
              ? undefined
              : {
                  duration: 0.5,
                  ease: [0.16, 1, 0.3, 1],
                  delay: CURTAIN_DURATION * 0.35 + navItems.length * 0.07,
                }
          }
        >
          <div>
            <p className="font-accent text-[10px] uppercase tracking-[0.25em] text-primary/50">
              Email
            </p>
            <a
              href={`mailto:${profile.email}`}
              className="mt-2 inline-block font-display text-sm text-primary transition-colors hover:text-accent md:text-base"
            >
              {profile.email}
            </a>
          </div>
          <div>
            <p className="font-accent text-[10px] uppercase tracking-[0.25em] text-primary/50">
              Phone
            </p>
            <a
              href={`tel:${profile.phone.replace(/\s+/g, "")}`}
              className="mt-2 inline-block font-display text-sm text-primary transition-colors hover:text-accent md:text-base"
            >
              {profile.phone}
            </a>
          </div>
          <div className="sm:col-span-2">
            <p className="font-accent text-[10px] uppercase tracking-[0.25em] text-primary/50">
              Social
            </p>
            <ul className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
              {profile.socials.map((social) => (
                <li key={social.label}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="font-display text-sm text-primary transition-colors hover:text-accent md:text-base"
                  >
                    {social.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* Bottom CTA bar — the site's only saturated-red surface (bg-secondary)
            gets used here to bookend the panel with the accent palette. */}
        <motion.a
          href={`mailto:${profile.email}`}
          initial={reduce ? false : { opacity: 0, y: 24 }}
          animate={reduce ? undefined : { opacity: 1, y: 0 }}
          transition={
            reduce
              ? undefined
              : {
                  duration: 0.55,
                  ease: [0.16, 1, 0.3, 1],
                  delay: CURTAIN_DURATION * 0.55 + navItems.length * 0.07,
                }
          }
          className="group mt-10 flex items-center justify-between gap-4 bg-secondary px-5 py-4 font-accent text-xs uppercase tracking-[0.25em] text-primary transition-colors hover:bg-accent"
        >
          <span>[ Contact me ]</span>
          <span className="hidden opacity-70 sm:inline">/ {profile.name}</span>
          <span
            aria-hidden
            className="inline-flex h-6 w-6 items-center justify-center border border-primary/40 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          >
            <ArrowUpRightIcon className="h-3 w-3" />
          </span>
        </motion.a>
      </div>
    </motion.div>
  );
}
