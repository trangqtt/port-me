export interface NavItem {
  /** Numeric index rendered as the mono index (e.g. "01"). */
  index: string;
  label: string;
  /** In-page anchor id or external href. */
  href: string;
}

export const navItems: readonly NavItem[] = [
  { index: "01", label: "Home", href: "#home" },
  { index: "02", label: "Work", href: "#work" },
  { index: "03", label: "Service", href: "#service" },
  { index: "04", label: "About", href: "#about" },
  { index: "05", label: "Contact", href: "#contact" },
] as const;
