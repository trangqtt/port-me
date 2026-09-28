export interface WhyChooseMetric {
  value: string;
  label: string;
}

export const whyChooseMetrics: readonly WhyChooseMetric[] = [
  { value: "4+", label: "Years of professional experience" },
  { value: "40+", label: "Happy clients who trust my work" },
  { value: "80%", label: "Clients come back for new projects" },
  { value: "50+", label: "Successfully completed projects" },
] as const;

export type WhyChooseCollageItem =
  | { kind: "disc"; key: string; label: string; width: number }
  | { kind: "image"; key: string; src: string; imageWidth: number; imageHeight: number; width: number; rotation?: number };

// The collage at the foot of the section, from Figma 717:3848. `width` is each piece's share of the band's width; where it lands is drawn at random on every load, spread out so pieces do not pile up.
// Figma spells the last disc "IU/UX"; every other surface on the site says "UI/UX", so that reads as a slip in the file rather than a name.
export const whyChooseCollage: readonly WhyChooseCollageItem[] = [
  { kind: "disc", key: "app-design", label: "App design", width: 0.084 },
  { kind: "disc", key: "visual-identity", label: "Visual identity", width: 0.084 },
  { kind: "disc", key: "branding-a", label: "Branding", width: 0.084 },
  { kind: "disc", key: "web-design", label: "Web design", width: 0.084 },
  { kind: "disc", key: "branding-b", label: "Branding", width: 0.084 },
  { kind: "disc", key: "ui-ux", label: "UI/UX", width: 0.084 },
  { kind: "image", key: "cd-player", src: "/images/why-choose-cd-player.webp", imageWidth: 800, imageHeight: 800, width: 0.138, rotation: 19.67 },
  { kind: "image", key: "tamagotchi", src: "/images/why-choose-tamagotchi.webp", imageWidth: 800, imageHeight: 800, width: 0.141 },
  { kind: "image", key: "bubble-1", src: "/images/why-choose-bubble-1.webp", imageWidth: 793, imageHeight: 800, width: 0.1 },
  { kind: "image", key: "bubble-2", src: "/images/why-choose-bubble-2.webp", imageWidth: 792, imageHeight: 800, width: 0.108 },
  { kind: "image", key: "bubble-3", src: "/images/why-choose-bubble-3.webp", imageWidth: 792, imageHeight: 800, width: 0.103 },
  { kind: "image", key: "bubble-4", src: "/images/why-choose-bubble-4.webp", imageWidth: 792, imageHeight: 800, width: 0.099 },
  { kind: "image", key: "gameboy", src: "/images/why-choose-gameboy.webp", imageWidth: 450, imageHeight: 800, width: 0.117 },
] as const;
