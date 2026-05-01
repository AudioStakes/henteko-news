import { readFile, writeFile } from "node:fs/promises";

export const compareJapanese = (a, b) => a.localeCompare(b, "ja");

export async function readTsConstArray(filePath, constName) {
  const source = await readFile(filePath, "utf8");
  const start = source.indexOf(`export const ${constName} =`);
  if (start < 0) throw new Error(`Missing const ${constName} in ${filePath}`);
  const arrStart = source.indexOf("[", start);
  let i = arrStart;
  let depth = 0;
  for (; i < source.length; i++) {
    if (source[i] === "[") depth++;
    else if (source[i] === "]") {
      depth--;
      if (depth === 0) break;
    }
  }
  const literal = source.slice(arrStart, i + 1);
  return Function(`return (${literal});`)();
}

export async function writeTsConstArray(filePath, constName, body) {
  const source = await readFile(filePath, "utf8");
  const regex = new RegExp(`export const ${constName} = \\[([\\s\\S]*?)\\](?: as const(?: satisfies [^;]+)?|);`, "m");
  const next = source.replace(regex, `export const ${constName} = [\n${body}\n] as const;`);
  await writeFile(filePath, next);
}
