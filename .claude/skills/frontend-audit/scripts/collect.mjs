#!/usr/bin/env node
// Gathers the mechanical facts a front-end audit needs and prints them as markdown.
// No dependencies beyond Node; uses `sips` for image dimensions when it is on the PATH (macOS).
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  }),
);
const root = process.cwd();
const srcDir = path.resolve(root, String(args.src ?? "src"));
const publicDir = path.resolve(root, String(args.public ?? "public"));
const distDir = path.resolve(root, String(args.dist ?? "dist"));

const walk = (dir, filter) => {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
      out.push(...walk(full, filter));
    } else if (!filter || filter(full)) out.push(full);
  }
  return out;
};
const kb = (n) => `${(n / 1024).toFixed(n < 10240 ? 1 : 0)} kB`;
const rel = (p) => path.relative(root, p);
const size = (p) => fs.statSync(p).size;

const out = [];
const h = (t) => out.push(`\n## ${t}\n`);
const line = (t) => out.push(t);
const table = (headers, rows) => {
  if (!rows.length) return line("_none_");
  line(`| ${headers.join(" | ")} |`);
  line(`| ${headers.map(() => "---").join(" | ")} |`);
  for (const r of rows) line(`| ${r.join(" | ")} |`);
};

// --- sources ---------------------------------------------------------------
const sourceFiles = walk(srcDir, (f) => /\.(tsx?|jsx?|css|html|mdx?)$/.test(f));
const sourceText = new Map(sourceFiles.map((f) => [f, fs.readFileSync(f, "utf8")]));
const allSource = [...sourceText.values()].join("\n");
const indexHtmlPath = path.join(root, "index.html");
const indexHtml = fs.existsSync(indexHtmlPath) ? fs.readFileSync(indexHtmlPath, "utf8") : "";

// --- dependencies ------------------------------------------------------------
h("Dependencies");
try {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  const deps = Object.entries(pkg.dependencies ?? {});
  table(["package", "version", "imported from (files)"], deps.map(([name, version]) => {
    const users = sourceFiles.filter((f) => new RegExp(`from ["']${name.replace(/[/\\-]/g, (m) => `\\${m}`)}(/|["'])`).test(sourceText.get(f))).length;
    return [name, version, String(users)];
  }));
  line(`\nScripts: ${Object.keys(pkg.scripts ?? {}).join(", ")}`);
  line(`Node in use: ${process.version}`);
} catch (e) {
  line(`package.json not readable: ${e.message}`);
}

// --- build output ------------------------------------------------------------
h("Built chunks (dist)");
if (fs.existsSync(distDir)) {
  const chunks = walk(distDir, (f) => /\.(js|css)$/.test(f)).map((f) => [rel(f), size(f)]).sort((a, b) => b[1] - a[1]);
  table(["file", "size"], chunks.map(([f, s]) => [f, kb(s)]));
  const stat = fs.statSync(distDir);
  line(`\ndist last modified: ${stat.mtime.toISOString()} (rebuild before trusting these numbers)`);
} else {
  line("no dist folder; run the production build first for chunk sizes");
}

// --- public assets -----------------------------------------------------------
h("Public assets");
const publicFiles = walk(publicDir).filter((f) => !/\.(DS_Store)$/.test(f));
const referenced = (f) => {
  const base = path.basename(f);
  const pub = "/" + path.relative(publicDir, f).split(path.sep).join("/");
  return allSource.includes(base) || allSource.includes(pub) || indexHtml.includes(base);
};
const unused = publicFiles.filter((f) => !referenced(f));
const totalPublic = publicFiles.reduce((n, f) => n + size(f), 0);
const totalUnused = unused.reduce((n, f) => n + size(f), 0);
line(`${publicFiles.length} files, ${kb(totalPublic)} total; ${unused.length} unreferenced from src or index.html, ${kb(totalUnused)}.`);
line("\nUnreferenced:");
table(["file", "size"], unused.sort((a, b) => size(b) - size(a)).map((f) => [rel(f), kb(size(f))]));
line("\nLargest media (top 15):");
const media = publicFiles.filter((f) => /\.(png|jpe?g|webp|gif|avif|svg|mp4|webm|mov)$/i.test(f)).sort((a, b) => size(b) - size(a)).slice(0, 15);
table(["file", "size", "referenced"], media.map((f) => [rel(f), kb(size(f)), referenced(f) ? "yes" : "no"]));

// --- fonts -------------------------------------------------------------------
h("Fonts");
const fontFiles = publicFiles.filter((f) => /\.(woff2?|otf|ttf|eot)$/i.test(f));
table(["file", "format", "size", "declared in CSS", "preloaded"], fontFiles.map((f) => {
  const base = path.basename(f);
  return [rel(f), path.extname(f).slice(1).toLowerCase(), kb(size(f)), allSource.includes(base) ? "yes" : "no", indexHtml.includes(base) && /rel=["']preload["']/.test(indexHtml) ? "yes" : "no"];
}));
const faces = [...allSource.matchAll(/@font-face\s*{([^}]*)}/g)].map((m) => m[1]);
if (faces.length) {
  line(`\n${faces.length} @font-face declarations. Weights and styles declared:`);
  const decl = faces.map((b) => {
    const fam = /font-family:\s*["']?([^;"']+)/.exec(b)?.[1] ?? "?";
    const w = /font-weight:\s*([^;]+)/.exec(b)?.[1] ?? "400";
    const st = /font-style:\s*([^;]+)/.exec(b)?.[1] ?? "normal";
    const disp = /font-display:\s*([^;]+)/.exec(b)?.[1] ?? "auto";
    return [fam.trim(), w.trim(), st.trim(), disp.trim()];
  });
  table(["family", "weight", "style", "display"], decl);
  const usedWeights = new Set([...allSource.matchAll(/\bfont-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)\b/g)].map((m) => m[1]));
  line(`\nTailwind weight utilities used in src: ${[...usedWeights].join(", ") || "none found (default 400)"}; italic utility used: ${/\bitalic\b/.test(allSource) ? "yes" : "no"}`);
}

// --- head --------------------------------------------------------------------
h("index.html head");
if (indexHtml) {
  const checks = [
    ["title", /<title>([^<]*)<\/title>/.exec(indexHtml)?.[1] ?? "missing"],
    ["meta description", /name=["']description["']/.test(indexHtml) ? "present" : "missing"],
    ["og:title", /property=["']og:title["']/.test(indexHtml) ? "present" : "missing"],
    ["og:image", /property=["']og:image["']/.test(indexHtml) ? "present" : "missing"],
    ["favicon link", /rel=["'](icon|shortcut icon)["']/.test(indexHtml) ? "present" : "missing"],
    ["theme-color", /name=["']theme-color["']/.test(indexHtml) ? "present" : "missing"],
    ["lang attribute", /<html[^>]*lang=/.test(indexHtml) ? "present" : "missing"],
    ["preload links", String((indexHtml.match(/rel=["']preload["']/g) ?? []).length)],
  ];
  table(["item", "value"], checks);
} else line("no index.html at project root");

// --- anchors -----------------------------------------------------------------
h("In-page anchors");
const ids = new Set([...allSource.matchAll(/\bid=["']([^"'{}]+)["']/g)].map((m) => m[1]));
const hrefs = new Set([...allSource.matchAll(/href[:=]\s*["'`]#([^"'`]+)["'`]/g)].map((m) => m[1]));
const broken = [...hrefs].filter((h) => !ids.has(h));
line(`ids in src: ${[...ids].sort().join(", ") || "none"}`);
line(`\nanchor targets in src: ${[...hrefs].sort().join(", ") || "none"}`);
line(`\nanchors with no matching id: ${broken.length ? broken.map((b) => "#" + b).join(", ") : "none"}`);
const h1s = [...allSource.matchAll(/<h1[\s>]/g)].length;
line(`\n<h1> occurrences in src: ${h1s}`);

// --- image attributes vs files ------------------------------------------------
h("Image width/height attributes vs files");
const hasSips = (() => { try { execFileSync("sips", ["--help"], { stdio: "ignore" }); return true; } catch { return false; } })();
const dims = (f) => {
  if (!hasSips) return null;
  try {
    const o = execFileSync("sips", ["-g", "pixelWidth", "-g", "pixelHeight", f], { encoding: "utf8" });
    const w = /pixelWidth:\s*(\d+)/.exec(o)?.[1];
    const hh = /pixelHeight:\s*(\d+)/.exec(o)?.[1];
    return w && hh ? [Number(w), Number(hh)] : null;
  } catch { return null; }
};
const mismatches = [];
for (const [f, text] of sourceText) {
  for (const m of text.matchAll(/src=\{?["']?(\/[^"'\s}]+\.(?:png|jpe?g|webp|gif|avif))["']?\}?[^>]*?width=\{?(\d+)\}?[^>]*?height=\{?(\d+)\}?/gs)) {
    const file = path.join(publicDir, m[1]);
    if (!fs.existsSync(file)) { mismatches.push([rel(f), m[1], `${m[2]}×${m[3]}`, "file missing"]); continue; }
    const d = dims(file);
    if (!d) continue;
    const ratioAttr = Number(m[2]) / Number(m[3]);
    const ratioFile = d[0] / d[1];
    if (Math.abs(ratioAttr - ratioFile) > 0.02) mismatches.push([rel(f), m[1], `${m[2]}×${m[3]}`, `${d[0]}×${d[1]}`]);
  }
}
if (!hasSips) line("`sips` not available; dimension check skipped (install ImageMagick or run on macOS)");
table(["component", "image", "attrs", "file"], mismatches);

// --- preload credentials mismatch --------------------------------------------
h("Preload hints in components");
const preloads = [...allSource.matchAll(/<link[^>]*rel=["']preload["'][^>]*>/g)].map((m) => m[0]);
line(preloads.length ? `${preloads.length} <link rel="preload"> rendered from components; ${preloads.filter((p) => !/crossOrigin|crossorigin/.test(p)).length} without crossorigin (browsers ignore the hint when credentials modes differ).` : "none");

// --- dead code signals --------------------------------------------------------
h("Dead code signals");
const rows = [];
for (const [f, text] of sourceText) {
  const lines = text.split("\n");
  let run = 0;
  lines.forEach((l, i) => {
    if (/^\s*\/\/\s*\S/.test(l) && /[;{}()]\s*$/.test(l)) run++; else { if (run >= 6) rows.push([rel(f), `${i - run + 1}-${i}`, `${run} lines of commented-out code`]); run = 0; }
  });
  if (/^"use client";?$/m.test(text)) rows.push([rel(f), "1", "\"use client\" directive (no-op outside Next.js)"]);
  if (/console\.log\(/.test(text)) rows.push([rel(f), "", "console.log present"]);
}
table(["file", "lines", "signal"], rows);

process.stdout.write(out.join("\n") + "\n");
