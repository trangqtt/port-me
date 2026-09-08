// "use client";
// import { useState } from "react";
// import { navItems } from "../../../data/navigation";
// import { profile } from "../../../data/profile";
// // import {
// //   MobileNav,
// //   MobileNavHeader,
// //   MobileNavMenu,
// //   MobileNavToggle,
// //   Navbar,
// //   NavbarLogo,
// // } from "../../ui/resizable-navbar";

// /**
//  * Aesthetic direction: a technical-editorial nav. The closed state is a
//  * minimal brand + MENU chip; the open state is a full-viewport dark curtain
//  * with oversized display-font labels indexed by mono numerals — the same
//  * chapter-marker language the intro loader uses.
//  */
// export function NavBar() {
//   const [isMenuOpen, setIsMenuOpen] = useState(false);
//   const close = () => setIsMenuOpen(false);

//   return (
//     <div className="relative w-full">
//       <Navbar>
//         <MobileNav>
//           <MobileNavHeader>
//             <NavbarLogo />
//             <MobileNavToggle
//               isOpen={isMenuOpen}
//               onClick={() => setIsMenuOpen((v) => !v)}
//             />
//           </MobileNavHeader>

//           <MobileNavMenu isOpen={isMenuOpen} onClose={close}>
//             {/* Header inside the curtain — logo left, close chip right.
//                 Uses the exact same chip styling as the MENU toggle so the two
//                 surfaces feel like one continuous element. */}
//             <div className="flex w-full items-center justify-between">
//               <NavbarLogo isOpen={isMenuOpen} />
//               <MobileNavToggle isOpen onClick={close} />
//             </div>

//             {/* Nav list — big display labels with mono chapter numbers. */}
//             <ul className="mt-14 flex w-full flex-col">
//               {navItems.map((item) => (
//                 <li key={item.href} className="border-b border-white/10">
//                   <a
//                     href={item.href}
//                     onClick={close}
//                     className="group flex items-baseline justify-between py-3 text-primary transition-colors hover:text-accent"
//                   >
//                     <span className="font-display text-4xl font-medium leading-[1.05] tracking-tight md:text-5xl">
//                       {item.label}
//                     </span>
//                     <span className="font-accent text-[11px] text-primary/50 transition-colors group-hover:text-accent">
//                       [{item.index}]
//                     </span>
//                   </a>
//                 </li>
//               ))}
//             </ul>

//             {/* Contact block. Space Mono micro-labels sit above display-font
//                 values — the type-contrast language used across the site. */}
//             <div className="mt-auto grid w-full grid-cols-2 gap-y-6 pt-16 pb-6">
//               <div>
//                 <p className="font-accent text-[10px] uppercase tracking-[0.25em] text-primary/50">
//                   Email
//                 </p>
//                 <a
//                   href={`mailto:${profile.email}`}
//                   className="mt-2 inline-block font-display text-sm text-primary transition-colors hover:text-accent"
//                 >
//                   {profile.email}
//                 </a>
//               </div>
//               <div>
//                 <p className="font-accent text-[10px] uppercase tracking-[0.25em] text-primary/50">
//                   Phone
//                 </p>
//                 <a
//                   href={`tel:${profile.phone.replace(/\s+/g, "")}`}
//                   className="mt-2 inline-block font-display text-sm text-primary transition-colors hover:text-accent"
//                 >
//                   {profile.phone}
//                 </a>
//               </div>
//               <div className="col-span-2">
//                 <p className="font-accent text-[10px] uppercase tracking-[0.25em] text-primary/50">
//                   Social
//                 </p>
//                 <ul className="mt-2 flex flex-wrap gap-x-5">
//                   {profile.socials.map((social) => (
//                     <li key={social.label}>
//                       <a
//                         href={social.href}
//                         target="_blank"
//                         rel="noreferrer noopener"
//                         className="font-display text-sm text-primary transition-colors hover:text-accent"
//                       >
//                         {social.label}
//                       </a>
//                     </li>
//                   ))}
//                 </ul>
//               </div>
//             </div>

//             {/* Bottom CTA bar — the only saturated-red surface (bg-secondary)
//                 bookends the panel with the accent palette. Full-bleed edge to
//                 edge, so we negative-margin past the parent's px-6/md:px-10. */}
//             <a
//               href={`mailto:${profile.email}`}
//               className="group -mx-6 flex items-center justify-between gap-4 bg-secondary px-5 py-4 font-accent text-[11px] uppercase tracking-[0.25em] text-primary transition-colors hover:bg-accent md:-mx-10"
//             >
//               <span>[ Contact me ]</span>
//               <span className="opacity-70">/ {profile.name}</span>
//               <span
//                 aria-hidden
//                 className="inline-flex h-6 w-6 items-center justify-center border border-primary/40 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
//               >
//                 <ArrowUpRight />
//               </span>
//             </a>
//           </MobileNavMenu>
//         </MobileNav>
//       </Navbar>
//     </div>
//   );
// }

// function ArrowUpRight() {
//   return (
//     <svg
//       viewBox="0 0 16 16"
//       fill="none"
//       stroke="currentColor"
//       strokeWidth="1.5"
//       strokeLinecap="square"
//       xmlns="http://www.w3.org/2000/svg"
//       aria-hidden
//       className="h-3 w-3"
//     >
//       <path d="M4 12L12 4" />
//       <path d="M5.5 4H12V10.5" />
//     </svg>
//   );
// }
