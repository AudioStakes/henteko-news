import { compareJapanese, readTsConstArray } from "./words-utils.mjs";

const MAX_LEN = 30;
const groups = [
  { key: "who", file: "src/data/words/who.ts", name: "WHO_WORDS", type: "string" },
  { key: "when", file: "src/data/words/when.ts", name: "WHEN_WORDS", type: "string" },
  { key: "where", file: "src/data/words/where.ts", name: "WHERE_WORDS", type: "string" },
  { key: "what", file: "src/data/words/what.ts", name: "WHAT_WORDS", type: "string" },
  { key: "action", file: "src/data/words/action.ts", name: "ACTION_WORDS", type: "action" },
  { key: "reaction", file: "src/data/words/reaction.ts", name: "REACTIONS", type: "string" },
];

let errors = 0;
let warnings = 0;
for (const group of groups) {
  const items = await readTsConstArray(group.file, group.name);
  const displays = items.map((item) => (typeof item === "string" ? item : item.display));
  const sorted = [...displays].sort(compareJapanese);
  if (JSON.stringify(displays) !== JSON.stringify(sorted)) {
    console.error(`[error] ${group.key}: words are not sorted`);
    errors += 1;
  }
  const seen = new Set();
  for (const item of items) {
    const display = typeof item === "string" ? item : item.display;
    if (!display) {
      console.error(`[error] ${group.key}: display empty`); errors++; continue;
    }
    if (display !== display.trim()) {
      console.error(`[error] ${group.key}: display has leading/trailing spaces: "${display}"`); errors++;
    }
    if (seen.has(display)) {
      console.error(`[error] ${group.key}: duplicate display "${display}"`); errors++;
    }
    seen.add(display);
    if (display.length > MAX_LEN) {
      console.warn(`[warn] ${group.key}: long display (${display.length}) ${display}`); warnings++;
    }
    if (group.type === "action") {
      const speech = item.speech ?? "";
      if (!speech.trim()) { console.error(`[error] action: speech empty for "${display}"`); errors++; }
      if (speech !== speech.trim()) { console.error(`[error] action: speech has leading/trailing spaces for "${display}"`); errors++; }
    }
  }
}
console.log(`check:words completed: ${groups.length} groups checked, ${errors} errors, ${warnings} warnings`);
if (errors > 0) process.exit(1);
