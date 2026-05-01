import fs from "node:fs";
import vm from "node:vm";

function extractActionMap() {
  const speechSource = fs.readFileSync("src/utils/speechText.ts", "utf8");
  const match = speechSource.match(
    /export const ACTION_POLITE_MAP: Record<string, string> = (\{[\s\S]*?\n\});/,
  );
  if (!match) throw new Error("ACTION_POLITE_MAP not found");
  return vm.runInNewContext(`(${match[1]})`);
}

function loadCategories(actionMap) {
  let source = fs.readFileSync("src/data/words.ts", "utf8");
  source = source.replace(/import[^;]+;\n/g, "");
  source = source.replace(/export const /g, "const ");
  source = source.replace(/: Category\[]/g, "");
  source += "\nmodule.exports = { CATEGORIES };";

  const sandbox = { ACTION_POLITE_MAP: actionMap, module: { exports: {} } };
  vm.runInNewContext(source, sandbox);
  return sandbox.module.exports.CATEGORIES;
}

const CATEGORIES = loadCategories(extractActionMap());
const MAX_LEN = 30;
let hasError = false;

for (const category of CATEGORIES) {
  const seen = new Set();
  for (const rawWord of category.words) {
    const word =
      typeof rawWord === "string" ? { display: rawWord, speech: rawWord } : rawWord;
    const display = word.display;

    if (!display) {
      console.error(`[error] ${category.key}: empty display`);
      hasError = true;
      continue;
    }
    if (display !== display.trim()) {
      console.error(`[error] ${category.key}: leading/trailing spaces: "${display}"`);
      hasError = true;
    }
    if (display.length > MAX_LEN) {
      console.warn(`[warn] ${category.key}: long display (${display.length}) ${display}`);
    }
    if (seen.has(display)) {
      console.warn(`[warn] ${category.key}: duplicate display ${display}`);
    }
    seen.add(display);

    if (category.key === "action" && !(word.speech ?? "").trim()) {
      console.error(`[error] action speech empty: ${display}`);
      hasError = true;
    }
  }
}

if (hasError) process.exit(1);
