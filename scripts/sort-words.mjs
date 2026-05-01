import { readFile, writeFile } from "node:fs/promises";
import { compareJapanese, readTsConstArray } from "./words-utils.mjs";

const stringGroups = [
  ["src/data/words/who.ts", "WHO_WORDS"],
  ["src/data/words/when.ts", "WHEN_WORDS"],
  ["src/data/words/where.ts", "WHERE_WORDS"],
  ["src/data/words/what.ts", "WHAT_WORDS"],
  ["src/data/words/reaction.ts", "REACTIONS"],
];

for (const [file, name] of stringGroups) {
  const values = await readTsConstArray(file, name);
  const sorted = [...new Set(values)].sort(compareJapanese);
  const content = `export const ${name} = [\n${sorted.map((v) => `  ${JSON.stringify(v)},`).join("\n")}\n] as const;\n`;
  await writeFile(file, content);
}

const actionFile = "src/data/words/action.ts";
const actions = await readTsConstArray(actionFile, "ACTION_WORDS");
const byDisplay = new Map();
for (const action of actions) {
  const existing = byDisplay.get(action.display);
  if (existing && existing.speech !== action.speech) {
    throw new Error(`Conflicting speech for duplicate display: ${action.display}`);
  }
  byDisplay.set(action.display, action);
}
const sortedActions = [...byDisplay.values()].sort((a, b) => compareJapanese(a.display, b.display));
const source = await readFile(actionFile, "utf8");
const replacement = `export const ACTION_WORDS = [\n${sortedActions.map((a) => `  { display: ${JSON.stringify(a.display)}, speech: ${JSON.stringify(a.speech)} },`).join("\n")}\n] as const satisfies readonly WordOption[];`;
const actionWordsPattern = /export const ACTION_WORDS = \[[\s\S]*?\] as const satisfies readonly WordOption\[];/m;
const next = source.replace(actionWordsPattern, replacement);
if (next === source) {
  throw new Error(`Failed to update ACTION_WORDS in ${actionFile}: expected block was not found.`);
}
await writeFile(actionFile, next);

console.log("sort:words completed");
