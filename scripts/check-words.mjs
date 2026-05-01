import fs from "node:fs";
import vm from "node:vm";

function loadActionWords() {
  let source = fs.readFileSync("src/data/actions.ts", "utf8");
  source = source.replace(/export type[\s\S]*?};\n\n/, "");
  source = source.replace(/export const ACTION_POLITE_MAP[\s\S]*/, "");
  source = source.replace(/export const /g, "const ");
  source = source.replace(/: ActionWord\[]/g, "");
  source += "\nmodule.exports = { ACTION_WORDS };";
  const sandbox = { module: { exports: {} } };
  vm.runInNewContext(source, sandbox);
  return sandbox.module.exports.ACTION_WORDS;
}

function loadCategories(actionWords) {
  let source = fs.readFileSync("src/data/words.ts", "utf8");
  source = source.replace(/import[^;]+;\n/g, "");
  source = source.replace(/export const /g, "const ");
  source = source.replace(/: ActionWord\[]/g, "");
  source = source.replace(/: Category\[]/g, "");
  source = source.replace(/words: ACTION_WORDS/g, "words: __ACTION_WORDS__");
  source += "\nmodule.exports = { CATEGORIES };";
  const sandbox = { __ACTION_WORDS__: actionWords, module: { exports: {} } };
  vm.runInNewContext(source, sandbox);
  return sandbox.module.exports.CATEGORIES;
}

const CATEGORIES = loadCategories(loadActionWords());
const MAX_LEN = 30;
let hasError = false;
for (const category of CATEGORIES) {
  const seen = new Set();
  for (const rawWord of category.words) {
    const word = typeof rawWord === "string" ? { display: rawWord, speech: rawWord } : rawWord;
    const display = word.display;
    if (!display) { console.error(`[error] ${category.key}: empty display`); hasError = true; continue; }
    if (display !== display.trim()) { console.error(`[error] ${category.key}: leading/trailing spaces: "${display}"`); hasError = true; }
    if (display.length > MAX_LEN) console.warn(`[warn] ${category.key}: long display (${display.length}) ${display}`);
    if (seen.has(display)) console.warn(`[warn] ${category.key}: duplicate display ${display}`);
    seen.add(display);
    if (category.key === "action" && !(word.speech ?? "").trim()) { console.error(`[error] action speech empty: ${display}`); hasError = true; }
  }
}
if (hasError) process.exit(1);
