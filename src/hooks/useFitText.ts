import { useLayoutEffect } from "react";

type FitMode = "shared" | "individual";

type FitTextOptions = {
  root: HTMLElement | null;
  minFontSize: number;
  maxFontSize: number;
  targetsSelector?: string;
  setFontSize?: (size: number) => void;
  watchDeps?: readonly unknown[];
  fitMode?: FitMode;
};

const FIT_TEXT_INLINE_BUFFER = 8;
const FIT_TEXT_BLOCK_BUFFER = 8;

export function useFitText({
  root,
  minFontSize,
  maxFontSize,
  targetsSelector,
  setFontSize,
  watchDeps = [],
  fitMode = "shared",
}: FitTextOptions) {
  useLayoutEffect(() => {
    if (!root) return;

    let isApplyingSize = false;

    const getTargets = () => {
      if (!targetsSelector) return [root];
      return Array.from(root.querySelectorAll<HTMLElement>(targetsSelector));
    };

    const getAvailableWidth = () => {
      return Math.max(0, root.clientWidth - FIT_TEXT_INLINE_BUFFER);
    };

    const getAvailableHeight = () => {
      return Math.max(0, root.clientHeight - FIT_TEXT_BLOCK_BUFFER);
    };

    const applySharedSize = (size: number, targets: HTMLElement[]) => {
      isApplyingSize = true;
      root.style.fontSize = `${size}px`;
      root.style.setProperty("--result-font-size", `${size}px`);
      root.style.setProperty("--reaction-font-size", `${size}px`);

      for (const target of targets) {
        target.style.fontSize = `${size}px`;
        target.style.setProperty("--result-font-size", `${size}px`);
        target.style.setProperty("--reaction-font-size", `${size}px`);
      }
      isApplyingSize = false;
    };

    const applyTargetSize = (target: HTMLElement, size: number) => {
      isApplyingSize = true;
      target.style.fontSize = `${size}px`;
      target.style.setProperty("--result-font-size", `${size}px`);
      target.style.setProperty("--reaction-font-size", `${size}px`);
      isApplyingSize = false;
    };

    const getMaxScrollWidth = (targets: HTMLElement[]) => {
      return Math.max(...targets.map((target) => Math.ceil(target.scrollWidth)));
    };

    const areTargetsVerticallyInsideRoot = (targets: HTMLElement[]) => {
      const rootRect = root.getBoundingClientRect();
      const halfBlockBuffer = FIT_TEXT_BLOCK_BUFFER / 2;
      const minTop = rootRect.top + halfBlockBuffer;
      const maxBottom = rootRect.bottom - halfBlockBuffer;

      return targets.every((target) => {
        const rect = target.getBoundingClientRect();

        return rect.top >= minTop && rect.bottom <= maxBottom;
      });
    };

    const canFitShared = (size: number, targets: HTMLElement[]) => {
      applySharedSize(size, targets);

      const availableWidth = Math.ceil(getAvailableWidth());
      const maxScrollWidth = getMaxScrollWidth(targets);

      return maxScrollWidth <= availableWidth && areTargetsVerticallyInsideRoot(targets);
    };

    const canFitTarget = (target: HTMLElement, size: number) => {
      applyTargetSize(target, size);

      const availableWidth = Math.ceil(getAvailableWidth());
      const availableHeight = Math.ceil(getAvailableHeight());
      const scrollWidth = Math.ceil(target.scrollWidth);
      const scrollHeight = Math.ceil(target.scrollHeight);

      return scrollWidth <= availableWidth && scrollHeight <= availableHeight;
    };

    const findBestSharedSize = (targets: HTMLElement[]) => {
      let low = minFontSize;
      let high = maxFontSize;
      let best = minFontSize;

      while (low <= high) {
        const mid = Math.floor((low + high) / 2);

        if (canFitShared(mid, targets)) {
          best = mid;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }

      return best;
    };

    const findBestTargetSize = (target: HTMLElement) => {
      let low = minFontSize;
      let high = maxFontSize;
      let best = minFontSize;

      while (low <= high) {
        const mid = Math.floor((low + high) / 2);

        if (canFitTarget(target, mid)) {
          best = mid;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }

      return best;
    };

    const fitSingleElement = () => {
      const targets = [root];
      const size = findBestSharedSize(targets);

      applySharedSize(size, targets);
      setFontSize?.(size);
    };

    const fitGroupedTargets = () => {
      const targets = getTargets();
      if (targets.length === 0) return;

      const size = findBestSharedSize(targets);

      applySharedSize(size, targets);
      setFontSize?.(size);
    };

    const fitIndividualTargets = () => {
      const targets = getTargets();
      if (targets.length === 0) return;

      const maxInlineSizes = targets.map((target) => findBestTargetSize(target));

      let low = minFontSize;
      let high = Math.max(...maxInlineSizes);
      let bestSizes = maxInlineSizes.map(() => minFontSize);

      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const trialSizes = maxInlineSizes.map((size) => Math.max(minFontSize, Math.min(size, mid)));

        for (const [index, target] of targets.entries()) {
          applyTargetSize(target, trialSizes[index]);
        }

        if (areTargetsVerticallyInsideRoot(targets)) {
          bestSizes = trialSizes;
          low = mid + 1;
        } else {
          high = mid - 1;
        }
      }

      for (const [index, target] of targets.entries()) {
        applyTargetSize(target, bestSizes[index]);
      }

      if (bestSizes.length > 0) {
        setFontSize?.(Math.min(...bestSizes));
      }
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

    fit();

    const onResize = () => {
      if (isApplyingSize) return;
      fit();
    };

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(onResize);

      observer.observe(root);

      return () => observer.disconnect();
    }

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [root, minFontSize, maxFontSize, targetsSelector, setFontSize, fitMode, ...watchDeps]);
}
