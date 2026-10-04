import { useEffect, useState } from "react";

export function useLocalStorage<T>(key: string, initialValue: T, parser: (value: unknown) => T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      if (item === null || item.length === 0) {
        return initialValue;
      }
      const parsed: unknown = JSON.parse(item);
      return parser(parsed);
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // ignore write errors
    }
  }, [key, value]);

  return [value, setValue] as const;
}
