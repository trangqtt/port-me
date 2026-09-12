"use client";
import { useState } from "react";
import { navItems } from "../../data/navigation";
import { profile } from "../../data/profile";
import {
  MobileNav,
  MobileNavToggle,
  Navbar,
  NavbarLogo,
  NavMenu,
} from "../ui/resizable-navbar";
import { ScrambleLink } from "../ui/ScrambleLink";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const close = () => setIsMenuOpen(false);
  const toggle = () => setIsMenuOpen((v) => !v);

  return (
    <header className="relative w-full">
      <Navbar>
        <MobileNav className="relative h-23 w-full py-4 lg:py-6 flex">
          <NavbarLogo className="" />

          <div className="absolute left-[27.5%] top-5.5 lg:flex flex-col font-accent text-sm xl:text-base uppercase leading-[1.2] text-primary/70 hidden">
            <a
              href={`mailto:${profile.email}`}
              className="transition-colors hover:text-accent"
            >
              {profile.email}
            </a>
            <a
              href={`tel:${profile.phone.replace(/\s+/g, "")}`}
              className="transition-colors hover:text-accent"
            >
              {profile.phone}
            </a>
          </div>

          <span className="absolute left-1/2 top-5.5 lg:flex items-center gap-1 font-accent text-sm xl:text-base uppercase leading-[1.2] text-primary/70 hidden">
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full bg-[#38A86A]"
            />
            {profile.status}
          </span>

          <div className="flex h-11 items-stretch gap-2">
            <MobileNavToggle isOpen={isMenuOpen} onClick={toggle} />
            <a
              href={`mailto:${profile.email}`}
              className="lg:flex h-11 w-37.5 items-center justify-center bg-secondary px-4 font-accent text-base uppercase leading-[1.2] text-primary transition-colors hover:bg-accent hidden"
            >
              Get in touch
            </a>
          </div>
        </MobileNav>

        <NavMenu isOpen={isMenuOpen} onClose={close}>
          <div className="flex w-full items-center justify-between">
            <NavbarLogo isOpen={isMenuOpen} />
            <MobileNavToggle isOpen onClick={close} />
          </div>

          {/* Nav list — big display labels with mono chapter numbers. */}
          <ul className="mt-14 xl:mt-25 flex w-full flex-col">
            {navItems.map((item) => (
              <li key={item.href} className="border-b border-white/10">
                <a
                  href={item.href}
                  onClick={close}
                  className="group flex items-baseline justify-between py-3 text-primary transition-colors hover:text-accent"
                >
                  <span className="font-display text-3xl font-medium leading-[1.05] tracking-tight xl:text-4xl">
                    {item.label}
                  </span>
                  <span className="font-accent text-sm text-primary/50 transition-colors group-hover:text-accent">
                    [{item.index}]
                  </span>
                </a>
              </li>
            ))}
          </ul>

          <div className="mt-auto grid w-full grid-cols-2 gap-8 pt-8 pb-8">
            <div>
              <p className="font-accent text-sm uppercase text-primary/50">
                Email
              </p>
              <a
                href={`mailto:${profile.email}`}
                className="mt-2 inline-block font-display text-base font-medium text-primary transition-colors hover:text-accent"
              >
                {profile.email}
              </a>
            </div>
            <div>
              <p className="font-accent text-sm uppercase text-primary/50">
                Phone
              </p>
              <a
                href={`tel:${profile.phone.replace(/\s+/g, "")}`}
                className="mt-2 inline-block font-display text-base font-medium text-primary transition-colors hover:text-accent"
              >
                {profile.phone}
              </a>
            </div>
            <div className="col-span-2">
              <p className="font-accent text-sm uppercase text-primary/50">
                Social
              </p>
              <ul className="mt-2 flex flex-wrap gap-x-5">
                {profile.socials.map((social) => (
                  <li key={social.label}>
                    <ScrambleLink
                      text={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="font-display text-base font-medium text-primary transition-colors hover:text-accent"
                    />
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <a
            href={`mailto:${profile.email}`}
            className="group -mx-6 flex items-center justify-between gap-4 bg-bg-secondary p-6 sm:px-8 sm:py-7.5 font-accent text-base uppercase text-primary transition-colors hover:bg-accent md:-mx-10"
          >
            <span>[ Contact me ]</span>
            <span>/ {profile.name}</span>
            <span
              aria-hidden
              className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            >
              [→]
            </span>
          </a>
        </NavMenu>
      </Navbar>
    </header>
  );
}


