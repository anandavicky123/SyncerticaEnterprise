const fs = require("fs");
const path = require("path");
const glob = require("glob");
const parser = require("@babel/parser");
const traverse = require("@babel/traverse").default;

const root = path.resolve(__dirname, "..");

function readFileSyncSafe(p) {
  try {
    return fs.readFileSync(p, "utf8");
  } catch (e) {
    return null;
  }
}

function isJsTsFile(f) {
  return /\.(js|jsx|ts|tsx)$/i.test(f);
}

function collectAllFiles() {
  // ignore node_modules and .next and out and dist
  return glob.sync("**/*.{js,jsx,ts,tsx,json,md,css,scss}", {
    cwd: root,
    absolute: true,
    ignore: [
      "**/node_modules/**",
      "**/.next/**",
      "**/out/**",
      "**/dist/**",
      "**/.git/**",
    ],
  });
}

function parseImports(filePath, content) {
  const imports = [];
  if (!content) return imports;
  try {
    const ast = parser.parse(content, {
      sourceType: "unambiguous",
      plugins: ["jsx", "typescript", "classProperties", "dynamicImport"],
    });
    traverse(ast, {
      ImportDeclaration({ node }) {
        imports.push(node.source.value);
      },
      CallExpression({ node }) {
        if (
          node.callee &&
          node.callee.name === "require" &&
          node.arguments &&
          node.arguments[0] &&
          node.arguments[0].value
        ) {
          imports.push(node.arguments[0].value);
        }
      },
      ImportExpression({ node }) {
        if (node.source && node.source.value) imports.push(node.source.value);
      },
    });
  } catch (e) {
    // ignore parse errors
  }
  return imports;
}

function resolveImport(fromFile, imp) {
  // handle absolute (package) imports -> return null
  if (!imp) return null;
  if (!imp.startsWith(".") && !imp.startsWith("/")) return null;
  const base = path.dirname(fromFile);
  const candidate = path.resolve(base, imp);
  const exts = [
    "",
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    "/index.js",
    "/index.jsx",
    "/index.ts",
    "/index.tsx",
  ];
  for (const e of exts) {
    const p = candidate + e;
    if (fs.existsSync(p) && fs.lstatSync(p).isFile()) return p;
  }
  return null;
}

function main() {
  const all = collectAllFiles();
  const jsFiles = all.filter((f) => isJsTsFile(f));
  const graph = new Map();
  for (const f of jsFiles) graph.set(f, new Set());

  // parse and record edges
  for (const f of jsFiles) {
    const content = readFileSyncSafe(f);
    const imps = parseImports(f, content);
    for (const imp of imps) {
      const resolved = resolveImport(f, imp);
      if (resolved && graph.has(resolved)) {
        graph.get(resolved).add(f); // inbound reference
      }
    }
  }

  // mark Next.js special files as used: app/page.tsx, app/layout.tsx, pages/_app.* etc
  const definitelyUsed = new Set();
  const nextEntrypoints = [
    "app/layout.tsx",
    "app/layout.jsx",
    "app/layout.ts",
    "app/layout.js",
    "app/page.tsx",
    "app/page.jsx",
    "app/page.ts",
    "app/page.js",
    "pages/_app.tsx",
    "pages/_app.js",
    "next.config.js",
    "package.json",
    "scripts",
  ];
  for (const e of nextEntrypoints) {
    const p = path.join(root, e);
    if (fs.existsSync(p)) definitelyUsed.add(path.resolve(p));
  }

  // also mark anything referenced in package.json scripts
  try {
    const pkg = JSON.parse(
      readFileSyncSafe(path.join(root, "package.json")) || "{}",
    );
    const scripts = pkg.scripts || {};
    Object.values(scripts).forEach((s) => {
      if (!s) return;
      const m = s.match(/node\s+(.+?)(\s|$)/);
      if (m) {
        const p = path.resolve(root, m[1]);
        if (fs.existsSync(p)) definitelyUsed.add(p);
      }
    });
  } catch (e) {}

  const unused = [];
  for (const [file, inbound] of graph.entries()) {
    if (definitelyUsed.has(path.resolve(file))) continue;
    if (inbound.size === 0) {
      // check if file is under app/(routes) - Next.js can use file-system routing; treat app/**/*.tsx/jsx/ts/js as used if filename is page or layout or route
      const rel = path.relative(root, file).replace(/\\/g, "/");
      if (/^app\//.test(rel)) {
        const base = path.basename(rel);
        if (
          base.startsWith("page.") ||
          base.startsWith("layout.") ||
          base.startsWith("route.")
        )
          continue;
      }
      unused.push({
        file: path.relative(root, file),
        reason: "no inbound imports",
        abs: file,
      });
    }
  }

  fs.writeFileSync(
    path.join(root, "unused-files-report.json"),
    JSON.stringify(
      { generatedAt: new Date().toISOString(), candidates: unused },
      null,
      2,
    ),
  );
  console.log(
    "Wrote unused-files-report.json with",
    unused.length,
    "candidates",
  );
}

main();
