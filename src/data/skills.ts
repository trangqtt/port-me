export interface SkillItem {
  name: string;
  description: string;
  descriptionLabel: "Desc." | "Tools.";
  url: string;
}

export const skills: readonly SkillItem[] = [
  {
    name: "UX Design",
    description:
      "User Research, Information Architecture, Wireframing, User Flow",
    descriptionLabel: "Desc.",
    url: "/images/skill-ux-design.png",
  },
  {
    name: "UI Design",
    description:
      "Visual Systems, Typography, Design Systems, Responsive Design, Motion Design, Prototyping",
    descriptionLabel: "Desc.",
    url: "/images/skill-ui-design.png",
  },
  {
    name: "Figma",
    description: "Design Systems, Prototyping, Auto Layout",
    descriptionLabel: "Desc.",
    url: "/images/skill-figma.png",
  },
  {
    name: "Photoshop",
    description: "Image Editing, Visual Assets, Compositing",
    descriptionLabel: "Tools.",
    url: "/images/skill-photoshop.png",
  },
  {
    name: "Illustrator",
    description: "Vector Graphics, Iconography, Illustration",
    descriptionLabel: "Desc.",
    url: "/images/skill-illustrator.png",
  },
  {
    name: "Motion",
    description: "After Effects, Premiere Pro",
    descriptionLabel: "Desc.",
    url: "/images/skill-motion.png",
  },
  {
    name: "Workflow & Management",
    description: "Design Handoff, Design Thinking, Stakeholder Collaboration",
    descriptionLabel: "Desc.",
    url: "/images/skill-workflow.png",
  },
  {
    name: "Front-end & No-code",
    description: "HTML/CSS, Basic JavaScript, Framer",
    descriptionLabel: "Desc.",
    url: "/images/skill-frontend.png",
  },
  {
    name: "AI & Content Creation",
    description: "Midjourney, AI Visual Assets Generation",
    descriptionLabel: "Desc.",
    url: "/images/skill-ai-content.png",
  },
  {
    name: "Soft Skills & Work Ethic",
    description:
      "Teamwork, Critical Thinking, Time Management, English Communication",
    descriptionLabel: "Desc.",
    url: "/images/skill-soft-skills.png",
  },
] as const;
