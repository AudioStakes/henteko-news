import { assert } from "vitest";

export function deferred<T>() {
  let resolve: ((value: T | PromiseLike<T>) => void) | undefined;
  let reject: ((reason?: unknown) => void) | undefined;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  assert(
    resolve !== undefined && reject !== undefined,
    "Promise callbacks initialize synchronously",
  );
  return { promise, resolve, reject };
}
