import { XMLParser } from "fast-xml-parser";
import * as fs from "node:fs/promises";
import * as path from "node:path";

type SvgNode = readonly [tag: string, attrs: Record<string, string | number>];

type IconDef = {
  name: string;
  viewBox: string;
  nodes: readonly SvgNode[];
};

type Options = {
  inputDir: string;
  outDir: string;
  prefix: string; // e.g. "Ph"
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  allowBooleanAttributes: true,
  preserveOrder: false,
  // keep values as strings; we’ll coerce selectively
  parseAttributeValue: false,
});

const SUPPORTED_TAGS = new Set([
  "path",
  "rect",
  "line",
  "circle",
  "ellipse",
  "polyline",
  "polygon",
]);

function toKebabAttr(attr: string) {
  // fast-xml-parser gives "@_stroke-width" already for kebab attrs,
  // but sometimes SVGs can have camel attrs (rare). Normalize both.
  // Example: strokeLinecap -> stroke-linecap
  return attr
    .replace(/^@_/, "")
    .replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)
    .toLowerCase();
}

function coerceAttrValue(key: string, value: string): string | number {
  // Coerce numeric-ish attrs to numbers when safe.
  // Keep path data and viewBox as strings.
  if (key === "d" || key === "viewbox") return value;

  // many svg numeric attrs are simple numbers in Phosphor
  const n = Number(value);
  if (
    !Number.isNaN(n) &&
    value.trim() !== "" &&
    String(n) === value.replace(/\.0+$/, "")
  ) {
    return n;
  }
  // handle "256" "16" etc even if the above equality is picky
  if (!Number.isNaN(n) && /^[+-]?\d+(\.\d+)?$/.test(value)) return n;

  return value;
}

function normalizeAttrs(
  raw: Record<string, unknown>,
): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (!k.startsWith("@_")) continue;
    if (v == null) continue;

    const key = toKebabAttr(k);
    const val = String(v);

    // Drop xmlns on inner nodes if it appears (usually only on root)
    if (key === "xmlns") continue;

    out[key] = coerceAttrValue(key, val);
  }
  return out;
}

function asArray<T>(x: T | T[] | undefined): T[] {
  if (!x) return [];
  return Array.isArray(x) ? x : [x];
}

function extractSvgObject(parsed: any): any {
  // Depending on parser options, root is typically { svg: {...} }
  if (parsed?.svg) return parsed.svg;
  // fallback
  const key = Object.keys(parsed ?? {})[0];
  return parsed?.[key];
}

function buildIconDef(fileName: string, svgObj: any, prefix: string): IconDef {
  const name = path.basename(fileName, ".svg");

  const viewBox = String(
    svgObj?.["@_viewBox"] ?? svgObj?.["@_viewbox"] ?? "0 0 256 256",
  );

  const nodes: SvgNode[] = [];

  for (const tag of SUPPORTED_TAGS) {
    const elements = asArray(svgObj?.[tag]);
    for (const el of elements) {
      const attrs = normalizeAttrs(el ?? {});
      // Ignore Phosphor’s full-canvas rect if it’s just a blank reset
      // <rect width="256" height="256" fill="none"/>
      if (
        tag === "rect" &&
        attrs["width"] === 256 &&
        attrs["height"] === 256 &&
        attrs["fill"] === "none" &&
        Object.keys(attrs).length <= 3
      ) {
        continue;
      }

      nodes.push([tag, attrs] as const);
    }
  }

  // Preserve original document order if you want exact fidelity:
  // Phosphor usually doesn’t rely on order for “regular”, but some sets might (duotone?).
  // If you find ordering issues, change parser to preserveOrder:true and walk it.
  // For now, tag-grouping is fast and consistent.

  if (nodes.length === 0) {
    throw new Error(`No supported SVG nodes found in ${fileName}`);
  }

  return { name, viewBox, nodes };
}

function pascalCaseIconName(name: string, prefix: string) {
  // printer -> PhPrinter
  // file-search -> PhFileSearch
  const parts = name.split(/[^a-zA-Z0-9]+/g).filter(Boolean);
  const pascal = parts
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("");
  return `${prefix}${pascal}`;
}

function tsLiteral(value: any): string {
  return JSON.stringify(value, null, 2);
}

function renderIconTs(def: IconDef, constName: string): string {
  return `import { PhIconDefinition } from "./helpers/phosphor-icon.types";

export const ${constName}: PhIconDefinition = ${tsLiteral(def)} as const;
`;
}

async function ensureDir(p: string) {
  await fs.mkdir(p, { recursive: true });
}

async function main() {
  const args = process.argv.slice(2);

  const opt: Options = {
    inputDir: args[0] ?? "Working-Iconset-Files/svgs/phosphor/regular",
    outDir: args[1] ?? "src/lib/iconsets/phosphor",
    prefix: args[2] ?? "Ph",
  };

  const inputAbs = path.resolve(opt.inputDir);
  const outAbs = path.resolve(opt.outDir);

  await ensureDir(outAbs);

  const files = (await fs.readdir(inputAbs)).filter((f) => f.endsWith(".svg"));
  files.sort((a, b) => a.localeCompare(b));

  const exports: { file: string; constName: string }[] = [];

  for (const file of files) {
    const svgText = await fs.readFile(path.join(inputAbs, file), "utf8");
    const parsed = parser.parse(svgText);
    const svgObj = extractSvgObject(parsed);

    const def = buildIconDef(file, svgObj, opt.prefix);
    const constName = pascalCaseIconName(def.name, opt.prefix);

    const outFile = `${def.name}.ts`;
    await fs.writeFile(
      path.join(outAbs, outFile),
      renderIconTs(def, constName),
      "utf8",
    );

    exports.push({ file: def.name, constName });
  }

  // icons/index.ts
  const indexTs = exports
    .map((e) => `export { ${e.constName} } from "./${e.file}";`)
    .join("\n")
    .concat("\n");

  await fs.writeFile(path.join(outAbs, "index.ts"), indexTs, "utf8");

  // optional: icons/all.ts aggregator (ships everything if used)
  const allTs = `import type { PhIconDefinition } from "./helpers/phosphor-icon.types";
${exports.map((e) => `import { ${e.constName} } from "./${e.file}";`).join("\n")}

export const PHOSPHOR_ALL_REGULAR_ICONS: readonly PhIconDefinition[] = [
${exports.map((e) => `  ${e.constName},`).join("\n")}
] as const;
`;

  await fs.writeFile(path.join(outAbs, "all.ts"), allTs, "utf8");

  console.log(
    `Generated ${exports.length} icons from ${inputAbs} -> ${outAbs}\n` +
      `- ${path.join(opt.outDir, "index.ts")}\n` +
      `- ${path.join(opt.outDir, "all.ts")}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
