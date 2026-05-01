import ts from "typescript";

const MAX_LEN = 30;

function compileTsModule(filePath) {
  const program = ts.createProgram([filePath], {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.CommonJS,
  });
  const sourceFile = program.getSourceFile(filePath);
  if (!sourceFile) throw new Error(`Could not load ${filePath}`);
  const diagnostics = ts.getPreEmitDiagnostics(program);
  if (diagnostics.length > 0) throw new Error(ts.formatDiagnosticsWithColorAndContext(diagnostics, ts.sys));
  let output = "";
  program.emit(sourceFile, (name, text) => {
    if (name.endsWith(".js")) output = text;
  });
  if (!output) throw new Error(`No JS output produced for ${filePath}`);
  return output;
}

function evaluateCommonJs(code, requireImpl = () => ({})) {
  const module = { exports: {} };
  const fn = new Function("module", "exports", "require", code);
  fn(module, module.exports, requireImpl);
  return module.exports;
}

const actionExports = evaluateCommonJs(compileTsModule("src/data/actions.ts"));
const wordsExports = evaluateCommonJs(compileTsModule("src/data/words.ts"), (specifier) => {
  if (specifier === "./actions") return actionExports;
  throw new Error(`Unsupported import in words.ts: ${specifier}`);
});
const CATEGORIES = wordsExports.CATEGORIES;

let hasError = false;
let errorCount = 0;
let warnCount = 0;
for (const category of CATEGORIES) {
  const seen = new Set();
  for (const rawWord of category.words) {
    const word = typeof rawWord === "string" ? { display: rawWord, speech: rawWord } : rawWord;
    const display = word.display;
    if (!display) {
      console.error(`[error] ${category.key}: empty display`);
      hasError = true;
      errorCount += 1;
      continue;
    }
    if (display !== display.trim()) {
      console.error(`[error] ${category.key}: leading/trailing spaces: "${display}"`);
      hasError = true;
      errorCount += 1;
    }
    if (display.length > MAX_LEN) {
      console.warn(`[warn] ${category.key}: long display (${display.length}) ${display}`);
      warnCount += 1;
    }
    if (seen.has(display)) {
      console.warn(`[warn] ${category.key}: duplicate display ${display}`);
      warnCount += 1;
    }
    seen.add(display);
    if (category.key === "action" && !(word.speech ?? "").trim()) {
      console.error(`[error] action speech empty: ${display}`);
      hasError = true;
      errorCount += 1;
    }
  }
}
console.log(`[summary] errors=${errorCount}, warnings=${warnCount}`);
if (hasError) process.exit(1);
