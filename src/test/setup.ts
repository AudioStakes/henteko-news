import type { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers";
import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup } from "@testing-library/react";
import { afterEach, expect } from "vitest";

declare module "vitest" {
  interface Matchers<R, T> extends TestingLibraryMatchers<T, R> {}
}

expect.extend(matchers);

afterEach(() => {
  cleanup();
});
