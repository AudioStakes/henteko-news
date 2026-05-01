import { useLayoutEffect } from "react";

type FitMode = "shared" | "individual";
type FitTextOptions = {
  root: HTMLElement | null;
  minFontSize: number;
  maxFontSize: number;
  targetsSelector?: string;
  getInitialFontSize?: () => number;
  setFontSize?: (size: number) => void;
  watchDeps?: readonly unknown[];
  fitMode?: FitMode;
};

const FIT_TEXT_INLINE_BUFFER = 16;
const FIT_TEXT_BLOCK_BUFFER = 4;

export function useFitText({
  root,
  minFontSize,
  maxFontSize,
  targetsSelector,
  getInitialFontSize,
  setFontSize,
  watchDeps = [],
  fitMode = "shared",
}: FitTextOptions) {
  useLayoutEffect(() => {
    if (!root) return;

    const clampSize = (size: number) => Math.max(minFontSize, Math.min(maxFontSize, size));

    const getStartSize = () => clampSize(getInitialFontSize?.() ?? maxFontSize);

    const applySize = (size: number, targets: HTMLElement[]) => {
      root.style.fontSize = `${size}px`;
      root.style.setProperty("--result-font-size", `${size}px`);

      for (const target of targets) {
        target.style.fontSize = `${size}px`;
        target.style.setProperty("--result-font-size", `${size}px`);
      }
    };

    const isOverflowing = (node: HTMLElement) => {
      const availableWidth = Math.max(0, node.clientWidth - FIT_TEXT_INLINE_BUFFER);
      const availableHeight = Math.max(0, node.clientHeight - FIT_TEXT_BLOCK_BUFFER);

      return (
        Math.ceil(node.scrollWidth) > Math.ceil(availableWidth) ||
        Math.ceil(node.scrollHeight) > Math.ceil(availableHeight)
      );
    };

    const fitSingleElement = () => {
      let size = getStartSize();
      const targets = [root];

      applySize(size, targets);

      while (size > minFontSize && isOverflowing(root)) {
        size -= 1;
        applySize(size, targets);
      }

      setFontSize?.(size);
    };

    const fitGroupedTargets = () => {
      const targets = Array.from(root.querySelectorAll<HTMLElement>(targetsSelector ?? ""));
      if (targets.length === 0) return;

      let size = getStartSize();
      applySize(size, targets);

      while (size > minFontSize) {
        const over = targets.some(isOverflowing);
        if (!over) break;

        size -= 1;
        applySize(size, targets);
      }

      setFontSize?.(size);
    };

    const fit = () => {
      if (!targetsSelector) {
        fitSingleElement();
        return;
      }

      if (fitMode === "individual") {
        fitIndividualTargets();
        return;
      }

      fitGroupedTargets();
    };

    const fitIndividualTargets = () => {
      const targets = Array.from(root.querySelectorAll<HTMLElement>(targetsSelector ?? ""));
      if (targets.length === 0) return;

      for (const target of targets) {
        let size = getStartSize();

        target.style.fontSize = `${size}px`;
        target.style.setProperty("--result-font-size", `${size}px`);

        while (size > minFontSize && isOverflowing(target)) {
          size -= 1;
          target.style.fontSize = `${size}px`;
          target.style.setProperty("--result-font-size", `${size}px`);
        }
      }
    };

    fit();

    const onResize = () => fit();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(onResize);
      observer.observe(root);

      for (const target of root.querySelectorAll<HTMLElement>(targetsSelector ?? "")) {
        observer.observe(target);
      }

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
    fitMode,
  ]);
}
