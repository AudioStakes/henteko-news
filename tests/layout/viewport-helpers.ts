import { expect, type Page } from "@playwright/test";

export async function expectOneScreen(page: Page, state: string) {
  await expect(page.locator(".app-footer")).toBeVisible();
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
  // Measure before clicking: Playwright clicks can automatically scroll a clipped control into view.
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const issues: string[] = [];
          const tolerance = 1;
          const width = Math.min(window.innerWidth, window.visualViewport?.width ?? Infinity);
          const height = Math.min(window.innerHeight, window.visualViewport?.height ?? Infinity);
          if (Math.abs(window.scrollX) > tolerance || Math.abs(window.scrollY) > tolerance) {
            issues.push(`Page scrolled to ${window.scrollX},${window.scrollY}`);
          }
          function checkContainers() {
            const result: string[] = [];
            for (const element of document.querySelectorAll(
              "html, body, .app-shell, .child-stage, .app-shell__main, .choice-grid, .choice-card, .result-bubble",
            )) {
              if (
                element.scrollWidth > element.clientWidth + tolerance ||
                element.scrollHeight > element.clientHeight + tolerance
              ) {
                result.push(
                  `${element.className.length > 0 ? element.className : element.tagName} overflows: ${element.scrollWidth}x${element.scrollHeight} in ${element.clientWidth}x${element.clientHeight}`,
                );
              }
            }
            return result;
          }
          const blocks = Array.from(
            document.querySelectorAll(
              ".app-header, .offline-notice, .caster, .step-indicator, .question, .choice-grid, .welcome-copy, .start-button, .sound-note, .result-bubble, .error-note, .result-actions, .app-footer",
            ),
          );
          const visibleBlocks = blocks.filter((element) => element.getClientRects().length > 0);
          function checkBounds() {
            const result: string[] = [];
            const controls = Array.from(
              document.querySelectorAll(
                ".choice-card, .screen button, .app-header__speech-settings, .app-footer a, .news-line, .caster-status",
              ),
            );
            for (const element of [...visibleBlocks, ...controls]) {
              const rect = element.getBoundingClientRect();
              if (
                rect.left < -tolerance ||
                rect.top < -tolerance ||
                rect.right > width + tolerance ||
                rect.bottom > height + tolerance
              ) {
                result.push(
                  `${element.className} outside ${width}x${height}: ${rect.left},${rect.top}–${rect.right},${rect.bottom}`,
                );
              }
            }
            return result;
          }
          function checkBlockOverlap() {
            const result: string[] = [];
            for (let i = 1; i < visibleBlocks.length; i += 1) {
              const previous = visibleBlocks[i - 1];
              const current = visibleBlocks[i];
              if (
                previous !== undefined &&
                current !== undefined &&
                previous.getBoundingClientRect().bottom >
                  current.getBoundingClientRect().top + tolerance
              ) {
                result.push(`${previous.className} overlaps ${current.className}`);
              }
            }
            return result;
          }
          function checkCardOverlap() {
            const result: string[] = [];
            const cards = Array.from(document.querySelectorAll(".choice-card"));
            for (const [i, card] of cards.entries()) {
              const rect = card.getBoundingClientRect();
              for (const other of cards.slice(i + 1)) {
                const next = other.getBoundingClientRect();
                if (
                  Math.min(rect.right, next.right) - Math.max(rect.left, next.left) > tolerance &&
                  Math.min(rect.bottom, next.bottom) - Math.max(rect.top, next.top) > tolerance
                ) {
                  result.push("Choice cards overlap");
                }
              }
            }
            return result;
          }
          function checkTouchTargets() {
            const result: string[] = [];
            for (const element of document.querySelectorAll(
              ".screen button, .app-header__speech-settings",
            )) {
              const rect = element.getBoundingClientRect();
              if (rect.width < 44 || rect.height < 44) {
                result.push(
                  `${element.textContent.trim()} touch target ${rect.width}x${rect.height} is below 44px`,
                );
              }
            }
            return result;
          }
          function checkTypography() {
            const result: string[] = [];
            for (const element of document.querySelectorAll(".choice-card__label, .news-line")) {
              if (Number.parseFloat(getComputedStyle(element).fontSize) < 18) {
                result.push(`Text below 18px: ${element.textContent.trim()}`);
              }
            }
            for (const line of document.querySelectorAll(".news-line")) {
              const range = document.createRange();
              range.selectNodeContents(line);
              const tops = Array.from(range.getClientRects(), (rect) => Math.round(rect.top));
              if (new Set(tops).size > 1) {
                result.push(`News phrase wraps: ${line.textContent.trim()}`);
              }
            }
            return result;
          }
          return [
            ...issues,
            ...checkContainers(),
            ...checkBounds(),
            ...checkBlockOverlap(),
            ...checkCardOverlap(),
            ...checkTouchTargets(),
            ...checkTypography(),
          ];
        }),
      `${state}: all content, controls and footer must fit in one unscrolled viewport`,
    )
    .toStrictEqual([]);
  await expectUnclippedText(page);
}

export async function expectUnclippedText(page: Page, checkViewport = true) {
  await expect
    .poll(
      () =>
        page.evaluate((insideViewport) => {
          const issues: string[] = [];
          const tolerance = 1;
          const viewportBounds = insideViewport
            ? {
                left: 0,
                top: 0,
                right: Math.min(window.innerWidth, window.visualViewport?.width ?? Infinity),
                bottom: Math.min(window.innerHeight, window.visualViewport?.height ?? Infinity),
              }
            : { left: -Infinity, top: -Infinity, right: Infinity, bottom: Infinity };
          function describeRect(rect: {
            left: number;
            top: number;
            right: number;
            bottom: number;
          }) {
            return [rect.left, rect.top, rect.right, rect.bottom]
              .map((value) => Math.round(value * 100) / 100)
              .join(",");
          }
          function clippedByAncestor(element: Element, fragments: DOMRect[]) {
            for (
              let parent = element.parentElement;
              parent !== null;
              parent = parent.parentElement
            ) {
              const rect = parent.getBoundingClientRect();
              const style = getComputedStyle(parent);
              const clipX = ["hidden", "clip"].includes(style.overflowX);
              const clipY = ["hidden", "clip"].includes(style.overflowY);
              if (
                fragments.some(
                  (fragment) =>
                    (clipX &&
                      (fragment.left < rect.left - tolerance ||
                        fragment.right > rect.right + tolerance)) ||
                    (clipY &&
                      (fragment.top < rect.top - tolerance ||
                        fragment.bottom > rect.bottom + tolerance)),
                )
              ) {
                return `${parent.tagName.toLowerCase()}.${parent.className} overflow(${style.overflowX},${style.overflowY}) bounds(${describeRect(rect)})`;
              }
            }
            return null;
          }
          for (const element of document.querySelectorAll(
            ".choice-card__label, .news-line, .question, .welcome-copy, .sound-note, .offline-notice, .error-note, .app-footer a, .caster-status, .nameplate span",
          )) {
            // Visible overflow from font metrics or <br> boxes is valid; test the actual clipping boundary.
            const bounds =
              element.closest(".choice-card, .result-bubble")?.getBoundingClientRect() ??
              viewportBounds;
            const range = document.createRange();
            range.selectNodeContents(element);
            const fragments = Array.from(range.getClientRects());
            const clippingAncestor = clippedByAncestor(element, fragments);
            if (
              fragments.some(
                (rect) =>
                  rect.left < bounds.left - tolerance ||
                  rect.right > bounds.right + tolerance ||
                  rect.top < bounds.top - tolerance ||
                  rect.bottom > bounds.bottom + tolerance,
              ) ||
              getComputedStyle(element).textOverflow === "ellipsis" ||
              clippingAncestor !== null
            ) {
              issues.push(
                `Clipped text: ${element.textContent.trim()}; boundary=${clippingAncestor ?? `viewport/container bounds(${describeRect(bounds)})`}; text ranges(${fragments.map(describeRect).join(" | ")})`,
              );
            }
          }
          return issues;
        }, checkViewport),
      "Rendered text must remain within its real clipping boundaries",
    )
    .toStrictEqual([]);
}
