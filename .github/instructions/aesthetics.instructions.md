---
applyTo: "src/components/**/*.{ts,tsx},src/styles/**/*.css,src/App.tsx"
description: Frontend aesthetic and motion rules for port-me — avoid generic AI design, commit to a bold, distinctive vision.
---

## Typography

- Load via Google Fonts or `@fontsource/*`.
- **use**: HelveticaNeue  (display) , NeueMontreal (accent).

## Color & Theme

- Commit to one cohesive palette. Define all colors as CSS variables in `src/styles/globals.css`.
- Use Tailwind's `theme.extend` to reference CSS variables (e.g. `text-primary` → `color: var(--color-primary)`).
- text-primary: main text color (#fff)
- text-secondary: secondary text (#000)
- accent: bright highlight color (#FF3B0E)
- bg-primary: main background (#0E0803)
- bg-secondary: background accent (#D23030

## Hard NEVERs
- Duplicate fonts, colors, or motion primitives. Reuse instead of reinventing.

## Implementation rules for this repo

- Define theme tokens (colors, fonts, spacing scale) as CSS variables in `src/styles/globals.css` under `@layer base`. Reference them in Tailwind via `tailwind.config.ts` `theme.extend`.
- Animation primitives live in `src/hooks/` (e.g. `useScrollReveal`, `useTypewriter`). Reuse instead of duplicating.
- Each section component (`src/components/sections/*.tsx`) owns its own visual identity — sections are allowed to look distinct from each other.
- Before adding a new font: justify why an existing one in the system does not work.

## Self-check before finishing a component

1. Did I state the aesthetic direction in 1 sentence?
2. Are typography, color, motion, and background each intentional (not default)?
3. Explained the source of each visual element (font, color, motion) and why it was chosen?
4. Did I avoid every item in the "Hard NEVERs" list?
