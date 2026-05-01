import { useLayoutEffect } from "react";

type FitTextOptions = {
  root: HTMLElement | null;
  minFontSize: number;
  maxFontSize: number;
  targetsSelector?: string;
  getInitialFontSize?: () => number;
  setFontSize?: (size: number) => void;
  watchDeps?: readonly unknown[];
};

export function useFitText({
  root,
  minFontSize,
  maxFontSize,
  targetsSelector,
  getInitialFontSize,
  setFontSize,
  watchDeps = [],
}: FitTextOptions) {
  useLayoutEffect(() => {
    if (!root) return;

    const fitElement = (target: HTMLElement) => {
      let size = getInitialFontSize?.() ?? maxFontSize;
      target.style.fontSize = `${size}px`;
      if (targetsSelector) target.style.setProperty("--result-font-size", `${size}px`);

      while (size > minFontSize) {
        const nodes = targetsSelector
          ? Array.from(target.querySelectorAll<HTMLElement>(targetsSelector))
          : [target];
        const over = nodes.some(
          (node) =>
            Math.ceil(node.scrollWidth) > Math.ceil(node.clientWidth) ||
            Math.ceil(node.scrollHeight) > Math.ceil(node.clientHeight),
        );
        if (!over) break;
        size -= 1;
        target.style.fontSize = `${size}px`;
        if (targetsSelector) target.style.setProperty("--result-font-size", `${size}px`);
      }
      setFontSize?.(size);
    };

    const targets = targetsSelector
      ? Array.from(root.querySelectorAll<HTMLElement>(targetsSelector))
      : [root];
    if (targets.length === 0) return;
    const fit = () => {
      for (const target of targets) fitElement(target);
    };
    fit();

    const onResize = () => fit();
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(onResize);
      observer.observe(root);
      return () => observer.disconnect();
    }

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [
    root,
    minFontSize,
    maxFontSize,
    targetsSelector,
    getInitialFontSize,
    setFontSize,
    ...watchDeps,
  ]);
}
