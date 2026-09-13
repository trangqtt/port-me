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
