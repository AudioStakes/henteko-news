import { readFile, writeFile } from "node:fs/promises";
import ts from "typescript";

export const compareJapanese = (a, b) => a.localeCompare(b, "ja");

function tsNodeToValue(node, filePath, constName) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }

  if (ts.isNumericLiteral(node)) {
    return Number(node.text);
  }

  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (node.kind === ts.SyntaxKind.NullKeyword) return null;

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
        throw new Error(
          `Unsupported spread element in const ${constName} in ${filePath}`,
        );
      }
      return tsNodeToValue(element, filePath, constName);
    });
  }

  if (ts.isObjectLiteralExpression(node)) {
    const result = {};
    for (const property of node.properties) {
      if (!ts.isPropertyAssignment(property) || property.initializer == null) {
        throw new Error(
          `Unsupported object property in const ${constName} in ${filePath}`,
        );
      }

      let key;
      if (ts.isIdentifier(property.name) || ts.isPrivateIdentifier(property.name)) {
        key = property.name.text;
      } else if (ts.isStringLiteral(property.name) || ts.isNumericLiteral(property.name)) {
        key = property.name.text;
      } else {
        throw new Error(
          `Unsupported object key in const ${constName} in ${filePath}`,
        );
      }

      result[key] = tsNodeToValue(property.initializer, filePath, constName);
    }
    return result;
  }

  throw new Error(
    `Const ${constName} in ${filePath} contains unsupported non-literal syntax`,
  );
}

function findExportedConstArray(source, filePath, constName) {
  const sourceFile = ts.createSourceFile(
    filePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );

  for (const statement of sourceFile.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    const isExported = statement.modifiers?.some(
      (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
    );
    if (!isExported) continue;

    for (const declaration of statement.declarationList.declarations) {
      if (!ts.isIdentifier(declaration.name) || declaration.name.text !== constName) {
        continue;
      }
      if (!declaration.initializer || !ts.isArrayLiteralExpression(declaration.initializer)) {
        throw new Error(`Const ${constName} in ${filePath} is not an array literal`);
      }
      return declaration.initializer;
    }
  }

  throw new Error(`Missing const ${constName} in ${filePath}`);
}

export async function readTsConstArray(filePath, constName) {
  const source = await readFile(filePath, "utf8");
  const arrayNode = findExportedConstArray(source, filePath, constName);
  return tsNodeToValue(arrayNode, filePath, constName);
}
export async function writeTsConstArray(filePath, constName, body) {
  const source = await readFile(filePath, "utf8");
  const regex = new RegExp(`export const ${constName} = \\[([\\s\\S]*?)\\](?: as const(?: satisfies [^;]+)?|);`, "m");
  const next = source.replace(regex, `export const ${constName} = [\n${body}\n] as const;`);
  await writeFile(filePath, next);
}
