## Stack

- **React 18** + **TypeScript** (strict mode)
- **Vite** (build tool, dev server)
- **Tailwind CSS** (styling)
- **Motion** / `motion` (declarative animations, page transitions)
- **Lenis** (smooth scroll)
- **Vitest** + `@testing-library/react` + `jsdom` (tests)
- Import alias: `@/*` → `./src/*`

## Commands

```bash
pnpm dev          # Vite dev server
pnpm build        # Type-check + production build
pnpm test         # Vitest in watch mode
pnpm test --run   # Single-pass test run (use in CI / after edits)
pnpm lint         # ESLint
```

<!-- Always run `pnpm test --run` after editing components or hooks. -->

## Source layout

```
src/
├── components/
│   ├── common/      # Layout, NavBar, Footer
│   ├── sections/    # Hero, About, Projects, Contact (one per landing section)
│   ├── Icon/        # Customable Icon SVG
│   └── ui/          # Reusable primitives (ProjectCard, SkillBadge, SocialLink)
├── data/            # Typed content objects (profile, projects, skills)
├── hooks/           # Custom hooks (useTypewriter, useScrollReveal)
├── types/           # Shared TS types/interfaces
├── styles/          # globals.css, reset.css (Tailwind layers + CSS vars)
├── App.tsx
└── main.tsx
```

Tests mirror this structure under `tests/` (e.g. `tests/components/sections/Hero.test.tsx`).

## Conventions

- **Components**: Function components, named export, PascalCase. Props typed via `interface ComponentNameProps`.
- **Styling**: Tailwind utility classes. Use `clsx` + `tailwind-merge` for conditional classes. Theme tokens (colors, fonts) live as CSS variables in `globals.css`.
- **Data**: Static content in `src/data/*.ts`, exported as typed const. Components import data; never hard-code copy in JSX.
- **Imports**: not use `@/` alias (e.g. `import { Hero } from "@/components/sections/Hero"`). Never `@/src/...` — `@` already points into `src/`.
