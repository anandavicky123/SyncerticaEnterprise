const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

function walk(dir, fileList = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    const rel = path.relative(root, full).replace(/\\/g, "/");
    if (
      rel.startsWith("node_modules/") ||
      rel.startsWith(".next/") ||
      rel.startsWith("out/") ||
      rel.startsWith("dist/") ||
      rel.startsWith(".git/")
    )
      continue;
    if (ent.isDirectory()) walk(full, fileList);
    else fileList.push(full);
  }
  return fileList;
}

function isCodeFile(f) {
  return /\.(js|jsx|ts|tsx)$/i.test(f);
}

function read(f) {
  try {
    return fs.readFileSync(f, "utf8");
  } catch (e) {
    return null;
  }
}

function extractImports(content) {
  if (!content) return [];
  const imports = new Set();
  // import ... from 'x'
  const re1 = /import\s+(?:[^'";]+?)from\s+['"]([^'"]+)['"]/g;
  let m;
  while ((m = re1.exec(content))) imports.add(m[1]);
  // import('x')
  const re2 = /import\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((m = re2.exec(content))) imports.add(m[1]);
  // require('x')
  const re3 = /require\(\s*['"]([^'"]+)['"]\s*\)/g;
  while ((m = re3.exec(content))) imports.add(m[1]);
  // export ... from 'x'
  const re4 = /export\s+[^'";]+from\s+['"]([^'"]+)['"]/g;
  while ((m = re4.exec(content))) imports.add(m[1]);
  return Array.from(imports);
}

function resolveImport(fromFile, imp) {
  if (!imp) return null;
  if (!imp.startsWith(".") && !imp.startsWith("/")) return null;
  const base = path.dirname(fromFile);
  const candidate = path.resolve(base, imp);
  const exts = [
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    "/index.js",
    "/index.jsx",
    "/index.ts",
    "/index.tsx",
    "",
  ];
  for (const e of exts) {
    const p = candidate + e;
    if (fs.existsSync(p) && fs.lstatSync(p).isFile()) return path.resolve(p);
  }
  return null;
}

function main() {
  const all = walk(root);
  const codeFiles = all.filter(isCodeFile).map((p) => path.resolve(p));
  const graph = new Map();
  for (const f of codeFiles) graph.set(f, new Set());

  for (const f of codeFiles) {
    const content = read(f);
    const imps = extractImports(content);
    for (const imp of imps) {
      const resolved = resolveImport(f, imp);
      if (resolved && graph.has(resolved)) {
        graph.get(resolved).add(f);
      }
    }
  }

  const definitelyUsed = new Set();
  const possibleEntrypoints = [
    "app/layout.tsx",
    "app/layout.jsx",
    "app/page.tsx",
    "app/page.jsx",
    "app/page.ts",
    "app/page.js",
    "app/layout.ts",
    "app/layout.js",
    "pages/_app.tsx",
    "pages/_app.js",
    "next.config.js",
    "package.json",
  ];
  for (const e of possibleEntrypoints) {
    const p = path.join(root, e);
    if (fs.existsSync(p)) definitelyUsed.add(path.resolve(p));
  }

  // scripts referenced in package.json
  try {
    const pkg = JSON.parse(read(path.join(root, "package.json")) || "{}");
    const scripts = pkg.scripts || {};
    Object.values(scripts).forEach((s) => {
      if (!s) return;
      const m = s.match(/node\s+([\"']?)([^\s\"']+)/);
      if (m) {
        const p = path.resolve(root, m[2]);
        if (fs.existsSync(p)) definitelyUsed.add(p);
      }
    });
  } catch (e) {}

  const unused = [];
  for (const [file, inbound] of graph.entries()) {
    if (definitelyUsed.has(path.resolve(file))) continue;
    if (inbound.size === 0) {
      const rel = path.relative(root, file).replace(/\\/g, "/");
      // treat app/page/layout/route as used
      if (/^app\//.test(rel)) {
        const base = path.basename(rel);
        if (/^(page|layout|route)\.(js|jsx|ts|tsx)$/.test(base)) continue;
      }
      // treat pages folders as used if special Next files
      if (/^pages\//.test(rel)) {
        const base = path.basename(rel);
        if (/^_app\.(js|jsx|ts|tsx)$/.test(base)) continue;
      }
      unused.push({ file: rel, reason: "no inbound imports" });
    }
  }

  const out = { generatedAt: new Date().toISOString(), candidates: unused };
  fs.writeFileSync(
    path.join(root, "unused-files-report.json"),
    JSON.stringify(out, null, 2)
  );
  console.log(
    "Wrote unused-files-report.json with",
    unused.length,
    "candidates"
  );
}

main();
