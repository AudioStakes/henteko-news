import fs from "node:fs";
import vm from "node:vm";

const speech = fs.readFileSync("src/utils/speechText.ts", "utf8");
const mapMatch = speech.match(/export const ACTION_POLITE_MAP: Record<string, string> = (\{[\s\S]*?\n\});/);
if (!mapMatch) throw new Error("ACTION_POLITE_MAP not found");
const ACTION_POLITE_MAP = vm.runInNewContext(`(${mapMatch[1]})`);

let src = fs.readFileSync("src/data/words.ts", "utf8");
src = src.replace(/import[^;]+;\n/g, "");
src = src.replace(/export const /g, "const ");
src = src.replace(/: Category\[]/g, "");
src += "\nmodule.exports = { CATEGORIES };";
const sandbox = { ACTION_POLITE_MAP, module: { exports: {} } };
vm.runInNewContext(src, sandbox);
const { CATEGORIES } = sandbox.module.exports;

const MAX_LEN = 30;
let hasError = false;
for (const category of CATEGORIES) {
  const seen = new Set();
  for (const raw of category.words) {
    const w = typeof raw === "string" ? { display: raw, speech: raw } : raw;
    if (!w.display) { console.error(`[error] ${category.key}: empty display`); hasError = true; }
    if (w.display !== w.display.trim()) { console.error(`[error] ${category.key}: leading/trailing spaces: "${w.display}"`); hasError = true; }
    if (w.display.length > MAX_LEN) console.warn(`[warn] ${category.key}: long display (${w.display.length}) ${w.display}`);
    if (seen.has(w.display)) console.warn(`[warn] ${category.key}: duplicate display ${w.display}`);
    seen.add(w.display);
    if (category.key === "action" && !(w.speech ?? "").trim()) { console.error(`[error] action speech empty: ${w.display}`); hasError = true; }
  }
}
if (hasError) process.exit(1);
