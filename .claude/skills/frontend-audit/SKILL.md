---
name: frontend-audit
description: Audit a front-end page, section, or whole app for build health, performance, accessibility, responsiveness, head metadata, and code quality, and deliver a ranked findings report with measured numbers. Use this whenever the user asks to audit, review, check, or assess the front end, a page, a section, or the UI, asks why a page is slow or heavy, asks for an a11y or performance check, mentions Lighthouse or Core Web Vitals, or asks "what's wrong with" a page, even if they do not say the word audit. Also use it before shipping a section the user built in this session when they ask if it is ready.
---

# Front-end audit

An audit is a ranked list of verified problems with the evidence that proves each one, not a tour of the code. The reader should be able to fix the first three items without opening the audit again.

## Workflow

1. **Fix the scope.** The argument names a page, section, component, or route. With no argument, audit the whole app. Note which sections, components, and entry files are in scope before reading anything, so the report can say what it did not look at.

2. **Gather facts with the script first.** Run it from the project root; it needs only Node:

   ```bash
   node .claude/skills/frontend-audit/scripts/collect.mjs [--src=src] [--public=public] [--dist=dist]
   ```

   It prints a markdown fact sheet: dependency list, built chunk sizes, public asset inventory with which files nothing references, font files by format and weight and whether they are preloaded, head metadata present in `index.html`, in-page anchors that point at ids that do not exist, images whose `width`/`height` attributes disagree with the file, and the largest media. Read it whole. Most performance and correctness findings start here, and the numbers in the final report come from it rather than from memory. Two caveats: "unreferenced" is a text match on file names, so a path assembled at runtime from a template string shows as unreferenced until you grep for its stem; and chunk sizes come from whatever `dist` holds, so rebuild first if its timestamp predates the code you are auditing.

3. **Run the project's own gates.** Type-check, lint, test, and production build, using the scripts in `package.json`. A failing build is always the first finding, because nothing else ships until it passes. Report exact error lines. If a test runner needs a newer Node than the shell has, say which version worked instead of reporting the tooling as broken.

4. **Read the code in scope.** Read every component in scope in full, plus the hooks, data files, and global styles they import. Use `references/checklist.md` as the list of things to look for; it is organised by category and explains why each item matters so you can recognise variants the list does not name. Do not report from the checklist alone: each finding needs a file and line you actually read.

5. **Look at it rendered when you can.** If Chrome is available, a headless screenshot at 1440×900 and 390×844 catches layout collisions, overflow, and the header covering content that no static read will. `scripts/screenshot.mjs` does this with `puppeteer-core` against a running dev server; it reports console errors too. Skip this quietly if there is no browser, and say so in the report.

6. **Verify before you write.** A claim goes in the report only if you saw the evidence: the number the script printed, the line you read, the error the build printed, the pixel in the screenshot. Where something is likely but unverified, say "verify" and give the exact condition to test. Distinguish what is broken from what is merely unconventional.

## Report structure

Use this shape. Headers only when the report runs past about 500 words, and at most these four.

```
Scope line: what was audited, what was left out.

## Blocking
Anything that stops a deploy or breaks navigation: build errors, dead links, missing tests the project's own docs demand.

## Performance
Bundle composition, duplicated libraries, fonts, images, video, unused assets, expensive layers. Numbers go in a small table, not prose.

## Accessibility and correctness
Headings, landmarks, dialogs, focus, contrast, theme variant gotchas, overflow, responsive collisions, placeholder data.

## Code quality
Convention breaches the project itself states, dead code, template leftovers, drifted docs, misleading attributes.

Suggested order: three sentences on what to fix first and why.
```

Rules that keep the report useful:

- Rank inside each section by impact. The reader fixes top to bottom.
- One finding per bullet: bold lead-in, the fact, the consequence, the file. Two sentences is usually enough.
- Every number lives in a table or on its own line, never buried in a sentence.
- Name at most one file per sentence. Reference lines as `path:line` so they are clickable.
- Pre-existing problems outside the scope are noted in one line, not fixed and not expanded.
- No praise padding. If a category has nothing, say so in one line.

## After the report

Offer to fix items, starting with the blocking ones, but do not start fixing unless asked. The audit is the deliverable.
