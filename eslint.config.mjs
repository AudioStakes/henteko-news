import vitest from "@vitest/eslint-plugin";
import { defineConfig, globalIgnores } from "eslint/config";
import playwright from "eslint-plugin-playwright";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

const typedFiles = [
  "src/**/*.{ts,tsx}",
  "tests/**/*.ts",
  "scripts/**/*.{mjs,mts}",
  "*.config.ts",
  "eslint.config.mjs",
  "public/sw.js",
];

export default defineConfig(
  globalIgnores([
    "node_modules/**",
    "dist/**",
    ".agents/**",
    ".codex/**",
    "public/onnxruntime/**",
    "public/supertonic/**",
    "public/licenses/**",
    "test-results/**",
    "playwright-report/**",
    "blob-report/**",
    "vite.config.js",
    "vite.config.d.ts",
  ]),
  {
    linterOptions: {
      noInlineConfig: true,
      reportUnusedDisableDirectives: "error",
      reportUnusedInlineConfigs: "error",
    },
  },
  {
    files: typedFiles,
    extends: [tseslint.configs.strictTypeCheckedOnly],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      "no-var": "off",
      "prefer-const": "off",
      "prefer-rest-params": "off",
      "prefer-spread": "off",
      "@typescript-eslint/ban-ts-comment": [
        "error",
        { "ts-expect-error": true, "ts-ignore": true, "ts-nocheck": true, "ts-check": false },
      ],
      "@typescript-eslint/no-floating-promises": [
        "error",
        { ignoreVoid: false, ignoreIIFE: false, checkThenables: true },
      ],
      "@typescript-eslint/switch-exhaustiveness-check": "error",
      "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
      "@typescript-eslint/strict-boolean-expressions": [
        "error",
        {
          allowString: false,
          allowNumber: false,
          allowNullableString: false,
          allowNullableNumber: false,
          allowNullableBoolean: false,
        },
      ],
    },
  },
  { files: ["src/**/*.{ts,tsx}"], extends: [reactHooks.configs.flat.recommended] },
  {
    files: ["src/components/**/*.{ts,tsx}"],
    ignores: ["src/components/**/*.test.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/hooks/**", "**/context/**", "**/data/**", "**/application/*"],
              message: "画面は公開API（src/application）から機能を利用してください。",
            },
            {
              group: [
                "**/utils/speech*",
                "**/utils/supertonic/**",
                "**/utils/soundEffects",
                "**/utils/analytics",
                "**/utils/appMode",
              ],
              message: "音声・保存・計測・モードの処理はapplicationに置いてください。",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/application/**/*.{ts,tsx}"],
    ignores: ["src/application/**/*.test.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["**/components/**", "**/App"], message: "機能APIは画面に依存できません。" },
          ],
        },
      ],
    },
  },
  {
    files: ["src/**/*.test.{ts,tsx}"],
    extends: [vitest.configs.recommended],
    rules: {
      "vitest/no-focused-tests": "error",
      "vitest/no-disabled-tests": "error",
      "vitest/expect-expect": "error",
      "vitest/no-conditional-expect": "error",
      "vitest/no-identical-title": "error",
      "vitest/no-duplicate-hooks": "error",
      "vitest/prefer-strict-equal": "error",
      "vitest/prefer-to-be": "error",
      "vitest/prefer-to-have-length": "error",
      "@typescript-eslint/unbound-method": "off",
      "vitest/unbound-method": "error",
    },
  },
  {
    files: ["tests/**/*.ts"],
    extends: [playwright.configs["flat/recommended"]],
    rules: {
      "playwright/no-focused-test": "error",
      "playwright/no-skipped-test": ["error", { allowConditional: false, disallowFixme: true }],
      "playwright/missing-playwright-await": "error",
      "playwright/no-conditional-expect": "error",
      "playwright/prefer-strict-equal": "error",
    },
  },
  {
    files: ["scripts/**/*.test.mjs"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "CallExpression > ObjectExpression.arguments > Property[key.name=/^(only|skip|todo)$/]",
          message: "Do not focus, skip, or mark Node tests as todo.",
        },
        {
          selector:
            "CallExpression > ObjectExpression.arguments > Property[key.value=/^(only|skip|todo)$/]",
          message: "Do not focus, skip, or mark Node tests as todo.",
        },
        {
          selector: "CallExpression[callee.property.name=/^(only|skip|todo)$/]",
          message: "Do not focus, skip, or mark Node tests as todo.",
        },
        {
          selector: "CallExpression[callee.property.value=/^(only|skip|todo)$/]",
          message: "Do not focus, skip, or mark Node tests as todo.",
        },
      ],
    },
  },
);
