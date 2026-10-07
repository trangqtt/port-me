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
    company: "Bearplus",
    role: "UI/UX Designer",
    period: "11/2024 - Now",
    image: "/images/about-experience-bearplus.webp",
    description:
      "Responsible for UI/UX design across diverse projects, including Agency, Dashboards, E-commerce, SaaS platforms, and Landing Pages.",
  },
  {
    company: "Physcode",
    role: "UI/UX Designer",
    period: "04/2023 - 10/2024",
    image: "/images/about-experience-physcode.webp",
    description:
      "Cross-platform UI/UX Designer driving end-to-end product design across Web, app, Blockchain, Education, and Game UI. Focused on intuitive UX optimization and scalable Design System architecture.",
  },
  {
    company: "Global Liaison",
    role: "UI/UX Designer",
    period: "1/2021 - 3/2023",
    image: "/images/about-experience-global-liaison.webp",
    description:
      "Website design, landing page mainly focuses on beauty and nail salons for customers in the US. Utilized WordPress and Shopify to optimize SEO and page load speed, meeting international technical standards.",
  },
  {
    company: "Freelancer",
    role: "Game Designer",
    period: "2026 - Now",
    image: "/images/about-experience-freelancer.webp",
    description:
      "Gameplay & Level Design: Craft game rules, mechanics, levels, and balance. Partner with Developers and Artists to bring concepts to life.",
  },
] as const;
