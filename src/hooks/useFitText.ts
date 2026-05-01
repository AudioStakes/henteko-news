import { useLayoutEffect } from "react";

type UseFitTextOptions = {
  minFontSize: number;
  maxFontSize: number;
  selectors?: string;
  getInitialFontSize?: () => number;
  setFontSize?: (size: number) => void;
};

export function useFitText(refs: Array<HTMLElement | null>, options: UseFitTextOptions) {
  useLayoutEffect(() => {
    const targets = refs.filter((ref): ref is HTMLElement => Boolean(ref));
    if (targets.length === 0) return;

    const fit = () => {
      for (const target of targets) {
        let size = options.getInitialFontSize?.() ?? options.maxFontSize;
        target.style.fontSize = `${size}px`;
        if (options.selectors) target.style.setProperty("--result-font-size", `${size}px`);

        while (size > options.minFontSize) {
          const nodes = options.selectors
            ? Array.from(target.querySelectorAll<HTMLElement>(options.selectors))
            : [target];
          const over = nodes.some(
            (node) =>
              Math.ceil(node.scrollWidth) > Math.ceil(node.clientWidth) ||
              Math.ceil(node.scrollHeight) > Math.ceil(node.clientHeight),
          );
          if (!over) break;
          size -= 1;
          target.style.fontSize = `${size}px`;
          if (options.selectors) target.style.setProperty("--result-font-size", `${size}px`);
        }
        options.setFontSize?.(size);
      }
    };

    fit();
    const onResize = () => fit();
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(onResize);
      for (const target of targets) observer.observe(target);
      return () => observer.disconnect();
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  });
}
