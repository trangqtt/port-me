# Audit checklist

What to look for, by category, with the reason each item matters. Use the reasons to spot variants the bullets do not name.

## Contents

1. Build and tooling
2. Bundle
3. Fonts
4. Images and video
5. Public assets
6. Head and metadata
7. Navigation and structure
8. Accessibility
9. Responsiveness and layout
10. Tailwind and CSS gotchas
11. Code quality and conventions
12. Docs drift

## 1. Build and tooling

- Run `tsc`, lint, tests, and the production build separately; a combined script hides which one failed. Unused imports under `noUnusedLocals` fail the build even though the dev server runs fine, so the app can look healthy while every deploy fails.
- Check that the test runner is configured at all: an empty test suite exits non-zero on Vitest, and a `test` script in the project docs that does not work is a finding.
- Lint configs that do not ignore scratch folders such as `.claude/worktrees` report phantom errors; note it once.
- Node version constraints: modern jsdom needs Node 20.19 or newer. If tests only pass under another installed Node, say which.

## 2. Bundle

- Read the production build output: a single chunk over about 500 kB minified needs splitting or a lighter dependency.
- Two animation or UI libraries doing one job each is the most common avoidable weight. Look for `gsap` plus `motion`, or two icon packs, or a full 3D engine loaded on first paint. Ask where the second library is used; if one component, port it or lazy-load it.
- Anything heavy that only one section needs belongs behind `React.lazy` so the main chunk stays small.
- Template leftovers such as `"use client"` in a Vite app or unused exports from a copied component library are dead weight and maintenance noise.

## 3. Fonts

- Format: OTF and TTF are two to four times the size of WOFF2. Every self-hosted face should be WOFF2.
- Weights: compare `@font-face` declarations against the weights and styles the code actually uses. Unused italics and weights still cost a request when referenced.
- Preload the one or two faces that render above the fold, or the largest text will paint in a fallback and swap, which is a layout shift you can see.
- `font-display: swap` without preload is the usual cause of a wordmark that jumps.

## 4. Images and video

- `width` and `height` attributes must match the file's real dimensions; wrong values mislead layout and the next developer. The script flags mismatches.
- Compare rendered size to source size. A 900 px source in a 200 px slot is fine on retina up to about 2.5×; beyond that it is waste.
- PNG for photographs or renders is almost always the wrong format; WebP at quality 80 to 85 is typically five to ten times smaller. Cut-outs with alpha also compress well as WebP.
- `<link rel="preload" as="image">` without a matching `crossorigin` attribute is ignored with a console warning when the consumer fetches with a different credentials mode.
- Video: `preload="auto"` on a large file forces the download on every visit; consider `metadata` or a media-query-gated `<source>` for phones. `mix-blend-mode` over a large area creates a compositing layer far bigger than the viewport on phones.
- Lazy cycles and carousels that mount later frames after a delay need their images warmed, or the first switch shows a blank.

## 5. Public assets

- List files under `public/` that nothing in `src` references. They do not ship to the browser, but they bloat the repo and the deploy, and they signal abandoned features.
- Huge source PNGs sitting next to their WebP conversions are a sign the originals were never deleted.
- A `1×1` placeholder image or a `149`-byte file in an image list is a bug waiting to render.

## 6. Head and metadata

- `<title>` should be a name, not the package name. Check for `meta description`, Open Graph title, description and image, favicon, `theme-color`, and preloads.
- For a portfolio or marketing site these decide what a shared link looks like; treat their absence as a real finding, not polish.

## 7. Navigation and structure

- Collect every in-page `href="#..."` and every `id="..."`; anchors without a target silently do nothing. The script prints the difference.
- Exactly one `<h1>` per page. Hidden sections such as an intro overlay often held it, so check that it still exists once they are disabled.
- Sections should be `<section aria-labelledby>` or `aria-label`; canvases need a visually hidden text equivalent of what they show.

## 8. Accessibility

- Dialogs and menus: `role="dialog"` plus `aria-modal` promise a focus trap, Escape to close, and focus moved into the panel on open. Check that the close callback is actually wired; a destructured-but-unused `onClose` is a classic.
- Decorative elements should be `aria-hidden`; text that only appears on hover needs a stable accessible name (`aria-label`) so scrambling or animating it does not read as gibberish.
- Contrast: white at 70% on near-black is fine; white at 50% on a saturated brand colour usually is not. Compute rather than guess when it is close.
- Everything interactive on desktop must also work on touch; hover-only reveals need a tap or focus path.
- `prefers-reduced-motion` must stop autonomous motion, not only shorten it.

## 9. Responsiveness and layout

- `w-screen` includes the scrollbar width on Windows and Linux and causes horizontal overflow; use `w-full`.
- Fixed pixel offsets from the top combined with `vw`-scaled elements from the bottom collide on short phones; check 360×640 as well as 390×844.
- A fixed header over a section that starts at the top of the page needs the section to reserve space or accept the overlap deliberately.
- Absolutely positioned bands pinned to the bottom of a section overlap flowing content when the content is taller than the viewport; on small screens they must flow instead.
- Sticky stages inside tall sections stop sticking when the section's bottom reaches the stage's bottom; scroll-driven ranges must match that pinned length.

## 10. Tailwind and CSS gotchas

- Tailwind v4 maps `dark:` to `prefers-color-scheme` by default. A site with no theme toggle that uses `dark:` variants renders differently for light-mode OS users; look for `bg-white/…` paired with `dark:bg-neutral-950/…` on a dark site.
- `cn()` with `tailwind-merge` lets a later `bg-white/80` silently replace `bg-transparent`; read merged class lists as the last one wins.
- Arbitrary values like `text-[4.167vw]` without a cap grow without limit on wide screens; check the widest breakpoint.
- Scroll-snap libraries with `mandatory` snapping trap sections taller than the viewport; check the snap points against tall sections.

## 11. Code quality and conventions

- Read the project's own conventions file (`AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`). Breaches of stated rules, such as copy hard-coded in JSX when the rule says copy lives in data files, are findings; matters of taste are not.
- Dead code: commented-out blocks longer than a few lines, hooks kept alive only for a disabled feature, refs attached for nothing.
- Data files with placeholder content such as social links pointing at a network's home page.
- Names that lie: a hook called random that returns constants, an attribute that says portrait for a landscape file.

## 12. Docs drift

- Version claims in docs versus `package.json` and `node_modules` (React 18 in the docs, 19 installed).
- Commands in docs that do not work with the package manager as written (`pnpm test --run` versus `pnpm test:run`).
- Folder maps that list files which do not exist.
