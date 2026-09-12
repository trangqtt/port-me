export interface ExperienceItem {
  company: string;
  role: string;
  period: string;
  image: string;
  description: string;
}

export const experience: readonly ExperienceItem[] = [
  {
    company: "Bearplus",
    role: "UI/UX Designer",
    period: "11/2024 - Now",
    image: "/images/about-experience-1.jpg",
    description:
      "Responsible for UI/UX design across diverse projects, including Agency, Dashboards, E-commerce, SaaS platforms, and Landing Pages.",
  },
  {
    company: "Bearplus",
    role: "UI/UX Designer",
    period: "11/2024 - Now",
    image: "/images/about-experience-1.jpg",
    description:
      "Responsible for UI/UX design across diverse projects, including Agency, Dashboards, E-commerce, SaaS platforms, and Landing Pages.",
  },
  {
    company: "Bearplus",
    role: "UI/UX Designer",
    period: "11/2024 - Now",
    image: "/images/about-experience-1.jpg",
    description:
      "Responsible for UI/UX design across diverse projects, including Agency, Dashboards, E-commerce, SaaS platforms, and Landing Pages.",
  },
] as const;
