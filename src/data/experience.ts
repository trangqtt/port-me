export interface ExperienceItem {
  company: string;
  role: string;
  period: string;
  image: string;
  description: string;
}

// Ordered most recent first, which is the order the slider steps through.
export const experience: readonly ExperienceItem[] = [
  {
    company: "Tinh Van",
    role: "UI/UX Designer",
    period: "7/2026 - Now",
    image: "/images/about-experience-tinhvan.jpg",
    description:
      "Cross-platform UI/UX Designer driving end-to-end product design across Web, App, SaaS, and Game UI. Focused on intuitive UX optimization and scalable Design System architecture.",
  },
  {
    company: "Bearplus",
    role: "UI/UX Designer",
    period: "11/2024 - 7/2026",
    image: "/images/about-experience-bearplus.jpg",
    description:
      "Responsible for UI/UX design across diverse projects, including Agency, Dashboards, E-commerce, SaaS platforms, and Landing Pages.",
  },
  {
    company: "Physcode",
    role: "UI/UX Designer",
    period: "11/2024 - 7/2026",
    image: "/images/about-experience-physcode.jpg",
    description:
      "Responsible for UI/UX design across diverse projects, including Agency, Dashboards, E-commerce, SaaS platforms, and Landing Pages.",
  },
] as const;
