"use client";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import React, { useEffect, useRef, useState } from "react";
import { cn } from "../../lib/utils";
import { LoadingPathLoop } from "../Icon/LoadingPathLoop";
import MenuIcon from "../Icon/MenuIcon";
import { NavbarScrolledContext } from "./navbar-scrolled-context";

// Scroll past this, in px, and the bar condenses.
const SCROLLED_AT = 100;
// The curtain's own curve. `power4.inOut` is the nearest GSAP name to the
// cubic-bezier(0.83, 0, 0.17, 1) this used before; both hold still at each end
// and cross the middle fast.
const CURTAIN_EASE = "power4.inOut";

interface NavbarProps {
  children: React.ReactNode;
  className?: string;
}

interface MobileNavProps {
  children: React.ReactNode;
  className?: string;
  visible?: boolean;
}

interface NavMenuProps {
  children: React.ReactNode;
  className?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const Navbar = ({ children, className }: NavbarProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState<boolean>(false);

  // A threshold, not a tween: this only ever asks whether the page has moved
  // past 100px, which a scroll listener answers without a motion value behind
  // it. Passive, because nothing here calls preventDefault.
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SCROLLED_AT);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      ref={ref}
      // IMPORTANT: Change this to class of `fixed` if you want the navbar to be fixed
      className={cn("fixed inset-x-0 top-0 z-40 w-full", className)}
    >
      <NavbarScrolledContext.Provider value={visible}>
        {React.Children.map(children, (child) =>
          React.isValidElement(child) && typeof child.type !== "string"
            ? React.cloneElement(
                child as React.ReactElement<{ visible?: boolean }>,
                { visible },
              )
            : child,
        )}
      </NavbarScrolledContext.Provider>
    </div>
  );
};

export const MobileNav = ({ children, className, visible }: MobileNavProps) => {
  return (
    <div
      className={cn(
        // Every property that changes between the two states is written in both as an interpolable value; `auto`, `none` and a missing height snap instead of easing.
        "relative z-20 flex w-auto flex-row items-center justify-between bg-transparent px-4 backdrop-blur-[0px] transition-[margin,padding,height,border-radius,background-color,backdrop-filter] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] lg:px-8",
        // Figma 722:4206: the bar condenses into a centred 600px glass pill with a 2px separating blur; one margin centres, caps and gutters it, bottoming out at 16px.
        visible &&
          "mx-[max(1rem,calc(50vw-300px))] rounded-[4px] bg-white/5 p-3 backdrop-blur-[2px]",
        className,
      )}
    >
      {children}
    </div>
  );
};

export const NavMenu = ({ children, className, isOpen }: NavMenuProps) => {
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  // Kept mounted across the closing animation. This is the one thing
  // AnimatePresence was doing that React does not: an element removed on the
  // same render as the state change has no chance to play its exit, so the
  // unmount waits for the tween instead.
  const [mounted, setMounted] = useState(isOpen);

  useEffect(() => {
    if (isOpen) setMounted(true);
  }, [isOpen]);

  useGSAP(
    () => {
      const backdrop = backdropRef.current;
      const panel = panelRef.current;
      if (!backdrop || !panel) return;

      if (isOpen) {
        gsap.to(backdrop, { autoAlpha: 1, duration: 0.1 });
        gsap.fromTo(
          panel,
          { clipPath: "inset(0 0 100% 0)" },
          { clipPath: "inset(0 0 0% 0)", duration: 0.65, ease: CURTAIN_EASE },
        );
        return;
      }

      gsap.to(backdrop, { autoAlpha: 0, duration: 0.1 });
      gsap.to(panel, {
        clipPath: "inset(0 0 100% 0)",
        duration: 0.65,
        ease: CURTAIN_EASE,
        onComplete: () => setMounted(false),
      });
    },
    { dependencies: [isOpen] },
  );

  if (!mounted) return null;

  return (
    <>
      <div
        ref={backdropRef}
        aria-hidden="true"
        style={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-bg-primary/60 backdrop-blur-sm"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
        style={{ clipPath: "inset(0 0 100% 0)" }}
        className={cn(
          // Full-viewport curtain on mobile; on desktop it narrows to a 550px panel anchored to the right edge.
          "fixed inset-0 z-50 flex w-full flex-col overflow-y-auto bg-bg-primary p-8 pb-0 text-primary lg:inset-y-0 lg:left-auto lg:right-0 lg:w-full lg:max-w-137.5",
          className,
        )}
      >
        {children}
      </div>
    </>
  );
};

export const MobileNavToggle = ({
  isOpen,
  onClick,
}: {
  isOpen: boolean;
  onClick: () => void;
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={isOpen}
      aria-label={isOpen ? "Close menu" : "Open menu"}
      className="flex h-11 items-center justify-end gap-2.5 bg-white/10 p-2.5 text-white transition-colors hover:bg-white/15"
    >
      {!isOpen && <MenuIcon width={18} height={18} fill="#fff" />}
      <span className="font-accent text-[11px] font-normal uppercase leading-[1.2] lg:text-base">
        {isOpen ? "Close [x]" : "Menu"}
      </span>
    </button>
  );
};

export const NavbarLogo = ({
  isOpen = false,
  className,
}: {
  isOpen?: boolean;
  className?: string;
}) => {
  return (
    <a
      href="#home"
      aria-label="MaiHoa — back to home"
      className={cn(
        "relative z-20 flex items-center gap-1.5 text-primary",
        className,
      )}
    >
      <div className="relative h-6 w-6 shrink-0 sm:h-8 sm:w-8">
        <LoadingPathLoop
          repeat={-1}
          className="asterisk-loader absolute top-0 left-0 h-full w-full text-primary"
        />
      </div>
      {!isOpen && (
        <span className="font-display text-[28px] font-medium leading-none text-primary sm:text-[32px]">
          MaiHoa
        </span>
      )}
    </a>
  );
};
