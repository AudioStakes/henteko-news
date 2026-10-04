import { assert } from "vitest";

export function requiredArrayElement<T>(values: readonly T[], index: number): T {
  const value = values[index];
  assert(value !== undefined, `Expected an element at index ${index}`);
  return value;
}
