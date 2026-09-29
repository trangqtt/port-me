export interface Work3D {
  title: string;
  category: string;
  role: string;
  description: string;
  image: string;
  href: string;
}

// Figma 1:417 "Work": the featured case studies shown on the Expertise v2 helix. One description is given in the file, so every card carries it until each study has its own.
const DESCRIPTION =
  "Produced key visual assets for large-scale entertainment shows including Running Man Vietnam supporting event communication and visual executions";

export const works3d: readonly Work3D[] = [
  { title: "Motion Design 01", category: "Motion Design", role: "UI UX Design", description: DESCRIPTION, image: "/images/expertise-v2-motion-01.webp", href: "#" },
  { title: "Motion Design 02", category: "Motion Design", role: "UI UX Design", description: DESCRIPTION, image: "/images/expertise-v2-motion-02.webp", href: "#" },
  { title: "Motion Design 03", category: "Motion Design", role: "UI UX Design", description: DESCRIPTION, image: "/images/expertise-v2-motion-03.webp", href: "#" },
  { title: "Motion Design 04", category: "Motion Design", role: "UI UX Design", description: DESCRIPTION, image: "/images/expertise-v2-motion-04.webp", href: "#" },
  { title: "Motion Design 05", category: "Motion Design", role: "UI UX Design", description: DESCRIPTION, image: "/images/expertise-v2-motion-05.webp", href: "#" },
  { title: "Website Fashion", category: "Website Fashion", role: "UI UX Design", description: DESCRIPTION, image: "/images/expertise-v2-website-fashion.webp", href: "#" },
] as const;
