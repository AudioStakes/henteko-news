import { useLayoutEffect } from "react";

export function useFitText(
  targets: Array<HTMLElement | null>,
  minFontSize: number,
  maxFontSize: number,
  selectors?: string,
  getInitialFontSize?: () => number,
  setFontSize?: (size: number) => void,
) {
  useLayoutEffect(() => {
    const elements = targets.filter((target): target is HTMLElement => Boolean(target));
    if (elements.length === 0) return;

    const fitElement = (target: HTMLElement) => {
      let size = getInitialFontSize?.() ?? maxFontSize;
      target.style.fontSize = `${size}px`;
      if (selectors) target.style.setProperty("--result-font-size", `${size}px`);

      while (size > minFontSize) {
        const nodes = selectors
          ? Array.from(target.querySelectorAll<HTMLElement>(selectors))
          : [target];
        const over = nodes.some(
          (node) =>
            Math.ceil(node.scrollWidth) > Math.ceil(node.clientWidth) ||
            Math.ceil(node.scrollHeight) > Math.ceil(node.clientHeight),
        );
        if (!over) break;
        size -= 1;
        target.style.fontSize = `${size}px`;
        if (selectors) target.style.setProperty("--result-font-size", `${size}px`);
      }
      setFontSize?.(size);
    };

    const fit = () => {
      for (const element of elements) fitElement(element);
    };
    fit();

    const onResize = () => fit();
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(onResize);
      for (const element of elements) observer.observe(element);
      return () => observer.disconnect();
    }

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [targets, minFontSize, maxFontSize, selectors, getInitialFontSize, setFontSize]);
}
