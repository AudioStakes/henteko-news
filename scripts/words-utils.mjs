import { readFile, writeFile } from "node:fs/promises";
import ts from "typescript";

/** @typedef {import("./word-types.mjs").LiteralValue} LiteralValue */
/** @typedef {import("./word-types.mjs").ActionWord} ActionWord */

/** @param {string} a @param {string} b */
export const compareJapanese = (a, b) => a.localeCompare(b, "ja");

/**
 * @param {import("typescript").Expression} node
 * @param {string} filePath
 * @param {string} constName
 * @returns {LiteralValue}
 */
function tsNodeToValue(node, filePath, constName) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }

  if (ts.isNumericLiteral(node)) {
    return Number(node.text);
  }

  if (node.kind === ts.SyntaxKind.TrueKeyword) {
    return true;
  }
  if (node.kind === ts.SyntaxKind.FalseKeyword) {
    return false;
  }
  if (node.kind === ts.SyntaxKind.NullKeyword) {
    return null;
  }

  if (
    ts.isPrefixUnaryExpression(node) &&
    node.operator === ts.SyntaxKind.MinusToken &&
    ts.isNumericLiteral(node.operand)
  ) {
    return -Number(node.operand.text);
  }

  if (ts.isArrayLiteralExpression(node)) {
    return node.elements.map((element) => {
      if (ts.isSpreadElement(element)) {
        throw new Error(`Unsupported spread element in const ${constName} in ${filePath}`);
      }
      return tsNodeToValue(element, filePath, constName);
    });
  }

  if (ts.isObjectLiteralExpression(node)) {
    return tsObjectToValue(node, filePath, constName);
  }

  throw new Error(`Const ${constName} in ${filePath} contains unsupported non-literal syntax`);
}

/**
 * @param {import("typescript").ObjectLiteralExpression} node
 * @param {string} filePath
 * @param {string} constName
 */
function tsObjectToValue(node, filePath, constName) {
  /** @type {{ [key: string]: LiteralValue }} */
  const result = {};
  for (const property of node.properties) {
    if (!ts.isPropertyAssignment(property)) {
      throw new Error(`Unsupported object property in const ${constName} in ${filePath}`);
    }

    let key;
    if (ts.isIdentifier(property.name) || ts.isPrivateIdentifier(property.name)) {
      key = property.name.text;
    } else if (ts.isStringLiteral(property.name) || ts.isNumericLiteral(property.name)) {
      key = property.name.text;
    } else {
      throw new Error(`Unsupported object key in const ${constName} in ${filePath}`);
    }

    result[key] = tsNodeToValue(property.initializer, filePath, constName);
  }
  return result;
}

/** @param {import("typescript").Expression} node */
function unwrapExpression(node) {
  let current = node;

  while (
    ts.isAsExpression(current) ||
    ts.isSatisfiesExpression(current) ||
    ts.isParenthesizedExpression(current) ||
    ts.isTypeAssertionExpression(current)
  ) {
    current = current.expression;
  }

  return current;
}

/** @param {string} source @param {string} filePath @param {string} constName */
function findExportedConstArray(source, filePath, constName) {
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );

  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) {
      continue;
    }
    const isExported = statement.modifiers?.some(
      (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
    );
    if (isExported !== true) {
      continue;
    }

    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || declaration.name.text !== constName) {
        continue;
      }
      const initializer = declaration.initializer && unwrapExpression(declaration.initializer);
      if (!(initializer && ts.isArrayLiteralExpression(initializer))) {
        throw new Error(`Const ${constName} in ${filePath} is not an array literal`);
      }
      return initializer;
    }
  }

  throw new Error(`Missing const ${constName} in ${filePath}`);
}

/** @param {string} filePath @param {string} constName @returns {Promise<LiteralValue[]>} */
export async function readTsConstArray(filePath, constName) {
  const source = await readFile(filePath, "utf8");
  const arrayNode = findExportedConstArray(source, filePath, constName);
  const values = tsNodeToValue(arrayNode, filePath, constName);
  if (!Array.isArray(values)) {
    throw new Error(`Const ${constName} in ${filePath} is not an array literal`);
  }
  return values;
}

/** @param {string} filePath @param {string} constName @returns {Promise<string[]>} */
export async function readTsStringArray(filePath, constName) {
  const values = await readTsConstArray(filePath, constName);
  if (!values.every((value) => typeof value === "string")) {
    throw new Error(`Const ${constName} in ${filePath} contains a non-string word`);
  }
  return values;
}

/** @param {unknown} value @returns {value is ActionWord} */
function isWordOption(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    "display" in value &&
    "speech" in value &&
    typeof value.display === "string" &&
    typeof value.speech === "string"
  );
}

/** @param {string} filePath @param {string} constName @returns {Promise<ActionWord[]>} */
export async function readTsWordOptions(filePath, constName) {
  const values = await readTsConstArray(filePath, constName);
  if (!values.every(isWordOption)) {
    throw new Error(`Const ${constName} in ${filePath} contains an invalid word option`);
  }
  return values;
}

/** @param {string} filePath @param {string} constName @param {string} body */
export async function writeTsConstArray(filePath, constName, body) {
  const source = await readFile(filePath, "utf8");
  const regex = new RegExp(
    `export const ${constName} = \\[([\\s\\S]*?)\\](?: as const(?: satisfies [^;]+)?|);`,
    "m",
  );
  const next = source.replace(regex, `export const ${constName} = [\n${body}\n] as const;`);
  await writeFile(filePath, next);
}
