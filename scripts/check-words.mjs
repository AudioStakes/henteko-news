import { compareJapanese, readTsConstArray } from "./words-utils.mjs";
import { WORD_CHECK_RULES } from "./word-rules.mjs";

const groups = [
  { key: "who", file: "src/data/words/who.ts", name: "WHO_WORDS", type: "string" },
  { key: "when", file: "src/data/words/when.ts", name: "WHEN_WORDS", type: "string" },
  { key: "where", file: "src/data/words/where.ts", name: "WHERE_WORDS", type: "string" },
  { key: "what", file: "src/data/words/what.ts", name: "WHAT_WORDS", type: "string" },
  { key: "action", file: "src/data/words/action.ts", name: "ACTION_WORDS", type: "action" },
];
const normalizeForCompare = (value) => value.replace(/\s+/gu, "").trim();
const speakablePattern = /^[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}ー〜～・、。！？!?\s0-9A-Za-z]+$/u;

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
  const seenIds = new Set();
  if (items.length < WORD_CHECK_RULES.minWordsPerCategory) {
    console.error(`[error] ${group.key}: too few words (${items.length})`);
    errors += 1;
  }
  for (const item of items) {
    const display = typeof item === "string" ? item : item.display;
    const id = typeof item === "string" ? item : item.id;
    if (!display) {
      console.error(`[error] ${group.key}: display empty`); errors++; continue;
    }
    if (id != null && !String(id).trim()) {
      console.error(`[error] ${group.key}: id empty for "${display}"`); errors++;
    }
    if (id != null) {
      if (seenIds.has(id)) {
        console.error(`[error] ${group.key}: duplicate id "${id}"`); errors++;
      }
      seenIds.add(id);
    }
    if (display !== display.trim()) {
      console.error(`[error] ${group.key}: display has leading/trailing spaces: "${display}"`); errors++;
    }
    if (seen.has(normalizeForCompare(display))) {
      console.error(`[error] ${group.key}: duplicate display "${display}"`); errors++;
    }
    seen.add(normalizeForCompare(display));
    if (display.length > WORD_CHECK_RULES.maxDisplayLength) {
      console.warn(`[warn] ${group.key}: long display (${display.length}) ${display}`); warnings++;
    }
    if (group.type === "action") {
      const speech = item.speech ?? "";
      if (!speech.trim()) { console.error(`[error] action: speech empty for "${display}"`); errors++; }
      if (speech !== speech.trim()) { console.error(`[error] action: speech has leading/trailing spaces for "${display}"`); errors++; }
      if (normalizeForCompare(speech) === normalizeForCompare(display)) {
        // valid and expected for many words
      } else if (Math.abs(display.length - speech.length) > 8) {
        console.warn(`[warn] action: display/speech length gap is large for "${display}"`); warnings++;
      }
      const strangeChars = [...speech].filter((char) => !speakablePattern.test(char)).length;
      if (speech.length > 0 && strangeChars / speech.length > WORD_CHECK_RULES.suspiciousCharRatio) {
        console.warn(`[warn] action: speech has many unusual characters for "${display}"`); warnings++;
      }
    }
  }
}
console.log(`check:words completed: ${groups.length} groups checked, ${errors} errors, ${warnings} warnings`);
if (errors > 0) process.exit(1);
