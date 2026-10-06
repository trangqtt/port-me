export interface SocialLink {
  label: string;
  href: string;
}

export const profile = {
  name: "MaiHoa",
  role: "UI UX Designer",
  email: "Hoamt0510@gmail.com",
  phone: "+84 829 366 310",
  status: "Available",
  socials: [
    {
      label: "LinkedIn",
      href: "https://www.linkedin.com/in/mai-hoa-0203652a1/",
    },
    { label: "Instagram", href: "https://www.instagram.com/" },
    { label: "Behance", href: "https://www.behance.net/hoamai99" },
  ] satisfies SocialLink[],
} as const;
