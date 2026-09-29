#!/usr/bin/env node
// Headless screenshots of a running page at desktop and phone sizes, plus console errors.
// Usage: node screenshot.mjs --url=http://localhost:5173/ [--section=id] [--out=./audit-shots] [--settle=6000] [--chrome=/path/to/chrome]
// Needs `puppeteer-core` resolvable from the current directory (npm i puppeteer-core) and a Chrome binary.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const args = Object.fromEntries(process.argv.slice(2).map((a) => { const [k, v] = a.replace(/^--/, "").split("="); return [k, v ?? true]; }));
const url = String(args.url ?? "http://localhost:5173/");
const outDir = path.resolve(String(args.out ?? "audit-shots"));
fs.mkdirSync(outDir, { recursive: true });

const candidates = [
  args.chrome,
  process.env.CHROME_PATH,
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter(Boolean);
const chrome = candidates.find((c) => fs.existsSync(String(c)));
if (!chrome) { console.error("No Chrome found; pass --chrome or set CHROME_PATH"); process.exit(2); }

let puppeteer;
// Resolved from the working directory, not from the skill folder, so any project or scratch folder with puppeteer-core installed works.
try { puppeteer = (await import(createRequire(path.join(process.cwd(), "package.json")).resolve("puppeteer-core"))).default; }
catch { console.error("puppeteer-core not installed here; run: npm i puppeteer-core"); process.exit(2); }

const browser = await puppeteer.launch({ executablePath: String(chrome), headless: true, args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--hide-scrollbars"] });
const report = [];
for (const [name, viewport] of [["desktop", { width: 1440, height: 900 }], ["phone", { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }]]) {
  const page = await browser.newPage();
  const logs = [];
  page.on("console", (m) => { if (["error", "warning"].includes(m.type())) logs.push(`${m.type()}: ${m.text()}`); });
  page.on("pageerror", (e) => logs.push(`pageerror: ${e.message}`));
  await page.setViewport(viewport);
  await page.goto(url, { waitUntil: "load", timeout: 60000 });
  // Lazy sections and WebGL scenes reveal well after load, so wait for the section itself, then give it a generous settle before scrolling and again after.
  if (args.section) await page.waitForSelector(`#${String(args.section)}`, { timeout: 30000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 2500));
  if (args.section) await page.evaluate((id) => document.getElementById(id)?.scrollIntoView({ behavior: "instant" }), String(args.section));
  await new Promise((r) => setTimeout(r, Number(args.settle ?? 6000)));
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  const file = path.join(outDir, `${name}${args.section ? "-" + args.section : ""}.png`);
  await page.screenshot({ path: file });
  report.push({ name, file, horizontalOverflow: overflow, console: logs });
  await page.close();
}
await browser.close();
console.log(JSON.stringify(report, null, 2));
