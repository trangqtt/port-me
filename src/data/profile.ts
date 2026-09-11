export interface SocialLink {
  label: string;
  href: string;
}

export const profile = {
  name: "MaiHoa",
  email: "Hoant0510@gmail.com",
  phone: "+84 829 366 310",
  status: "Available",
  socials: [
    { label: "LinkedIn", href: "https://www.linkedin.com/" },
    { label: "Instagram", href: "https://www.instagram.com/" },
    { label: "Behance", href: "https://www.behance.net/" },
  ] satisfies SocialLink[],
} as const;
