export interface SkillItem {
  name: string;
  description: string;
  descriptionLabel: "Desc." | "Tools.";
  /** Full-size art for the desktop hover preview, shown up to 360px wide. */
  url: string;
  /** 120px cut for the phone's 60px row thumbnail. Serving `url` there costs
   *  38x the bytes for a fortieth of the pixels. */
  thumbUrl: string;
}

export const skills: readonly SkillItem[] = [
  {
    name: "UX Design",
    description:
      "User Research, Information Architecture, Wireframing, User Flow",
    descriptionLabel: "Desc.",
    url: "/images/skill-ux-design.webp",
    thumbUrl: "/images/skill-ux-design-thumb.webp",
  },
  {
    name: "UI Design",
    description:
      "Visual Systems, Typography, Design Systems, Responsive Design, Motion Design, Prototyping",
    descriptionLabel: "Desc.",
    url: "/images/skill-ui-design.webp",
    thumbUrl: "/images/skill-ui-design-thumb.webp",
  },
  {
    name: "Figma",
    description: "Design Systems, Prototyping, Auto Layout",
    descriptionLabel: "Desc.",
    url: "/images/skill-figma.webp",
    thumbUrl: "/images/skill-figma-thumb.webp",
  },
  {
    name: "Photoshop",
    description: "Image Editing, Visual Assets, Compositing",
    descriptionLabel: "Tools.",
    url: "/images/skill-photoshop.webp",
    thumbUrl: "/images/skill-photoshop-thumb.webp",
  },
  {
    name: "Illustrator",
    description: "Vector Graphics, Iconography, Illustration",
    descriptionLabel: "Desc.",
    url: "/images/skill-illustrator.webp",
    thumbUrl: "/images/skill-illustrator-thumb.webp",
  },
  {
    name: "Motion",
    description: "After Effects, Premiere Pro",
    descriptionLabel: "Desc.",
    url: "/images/skill-motion.webp",
    thumbUrl: "/images/skill-motion-thumb.webp",
  },
  {
    name: "Workflow & Management",
    description: "Design Handoff, Design Thinking, Stakeholder Collaboration",
    descriptionLabel: "Desc.",
    url: "/images/skill-workflow.webp",
    thumbUrl: "/images/skill-workflow-thumb.webp",
  },
  {
    name: "Front-end & No-code",
    description: "HTML/CSS, Basic JavaScript, Framer",
    descriptionLabel: "Desc.",
    url: "/images/skill-frontend.webp",
    thumbUrl: "/images/skill-frontend-thumb.webp",
  },
  {
    name: "AI & Content Creation",
    description: "Midjourney, AI Visual Assets Generation",
    descriptionLabel: "Desc.",
    url: "/images/skill-ai-content.webp",
    thumbUrl: "/images/skill-ai-content-thumb.webp",
  },
  {
    name: "Soft Skills & Work Ethic",
    description:
      "Teamwork, Critical Thinking, Time Management, English Communication",
    descriptionLabel: "Desc.",
    url: "/images/skill-soft-skills.webp",
    thumbUrl: "/images/skill-soft-skills-thumb.webp",
  },
] as const;
