import { expect, test } from "@playwright/test";
import { getVisibleBounds, pressTab } from "./helpers";

// Keep request interception independent of the worker; offline behavior has its own E2E coverage.
test.use({ serviceWorkers: "block" });

interface BrowserSpeechCall {
  text: string;
  lang: string;
  rate: number;
  pitch: number;
}

declare global {
  interface Window {
    browserSpeechCalls?: BrowserSpeechCall[];
  }
}

test("default browser speech reads news without requesting model assets", async ({ page }) => {
  const errors: string[] = [];
  const modelRequests: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (/\/supertonic\/|\/onnxruntime\/|\.onnx(?:$|\?)/.test(request.url())) {
      modelRequests.push(request.url());
    }
  });
  await page.addInitScript(() => {
    const calls: BrowserSpeechCall[] = [];
    window.browserSpeechCalls = calls;
    let endTimer = 0;
    const synthesis = Object.assign(new EventTarget(), {
      getVoices: () => [],
      cancel: () => {
        window.clearTimeout(endTimer);
      },
      speak: (utterance: SpeechSynthesisUtterance) => {
        calls.push({
          text: utterance.text,
          lang: utterance.lang,
          rate: utterance.rate,
          pitch: utterance.pitch,
        });
        utterance.dispatchEvent(new Event("start"));
        endTimer = window.setTimeout(() => utterance.dispatchEvent(new Event("end")), 0);
      },
    });
    Object.defineProperty(window, "speechSynthesis", { value: synthesis, configurable: true });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "はじめる" }).click();
  for (const label of ["だれが？", "いつ？", "どこで？", "なにを？", "どうした？"]) {
    await expect(page.locator(".speech-select")).toHaveText(label);
    await page.getByTestId("choice-card").first().click();
  }
  const replayButton = page.getByRole("button", { name: "きく", exact: true });
  await expect(replayButton).toBeEnabled();
  const displayedLines = page.getByLabel("かんせいニュース").locator(".news-line");
  await expect(displayedLines).toHaveCount(5);
  const lines = await displayedLines.allTextContents();
  const expectedText = `ニュースです！${lines.map((line) => line.trim().replace(/[！!]+$/, "")).join("、")}！`;
  await replayButton.click();
  await expect(replayButton).toBeEnabled();
  const calls = await page.evaluate(() => window.browserSpeechCalls ?? []);
  const expectedCall = { text: expectedText, lang: "ja-JP", rate: 0.75, pitch: 1.25 };
  expect(calls).toStrictEqual([expectedCall, expectedCall]);
  expect(modelRequests).toStrictEqual([]);
  expect(errors).toStrictEqual([]);
});

test("settings preserve the game and configured model paths across reloads", async ({ page }) => {
  const requested: string[] = [];
  await page.route("**/custom-model/**", (route) => {
    requested.push(route.request().url());
    return route.fulfill({ status: 404, body: "model not deployed" });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "はじめる" }).click();
  await expect(page.locator(".speech-select")).toHaveText("だれが？");
  await page.getByRole("button", { name: "おとな：音声設定", exact: true }).click();
  await expect(page.getByLabel("読み上げ方式")).toHaveValue("web-speech");
  await page.getByLabel("読み上げ方式").selectOption("supertonic");
  await page.getByLabel("モデルのフォルダー").fill("/custom-model/onnx");
  await page.getByLabel("声のJSONファイル").fill("/custom-model/voices/F1.json");
  await page.getByRole("button", { name: "設定を保存", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.locator(".speech-select")).toHaveText("だれが？");

  await page.reload();
  await page.getByRole("button", { name: "おとな：音声設定", exact: true }).click();
  await expect(page.getByLabel("読み上げ方式")).toHaveValue("supertonic");
  await expect(page.getByLabel("モデルのフォルダー")).toHaveValue("/custom-model/onnx");
  await expect(page.getByLabel("声のJSONファイル")).toHaveValue("/custom-model/voices/F1.json");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "はじめる" }).click();
  await expect.poll(() => requested.some((url) => url.endsWith("/onnx/tts.json"))).toBe(true);
  await expect.poll(() => requested.some((url) => url.endsWith("/voices/F1.json"))).toBe(true);

  await page.getByRole("button", { name: "おとな：音声設定", exact: true }).click();
  await page.getByLabel("読み上げ方式").selectOption("web-speech");
  await page.getByRole("button", { name: "設定を保存", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: "おとな：音声設定", exact: true }).click();
  await expect(page.getByLabel("読み上げ方式")).toHaveValue("web-speech");
  await expect(page.getByLabel("モデルのフォルダー")).toHaveCount(0);
});

test("the caster follows actual speech preparation, playback, and cancellation", async ({
  page,
}) => {
  await page.addInitScript(() => {
    let current: SpeechSynthesisUtterance | null = null;
    const synthesis = Object.assign(new EventTarget(), {
      getVoices: () => [],
      cancel: () => {
        current = null;
      },
      speak: (utterance: SpeechSynthesisUtterance) => {
        current = utterance;
      },
    });
    window.addEventListener("test:speech-start", () => current?.dispatchEvent(new Event("start")));
    window.addEventListener("test:speech-end", () => current?.dispatchEvent(new Event("end")));
    Object.defineProperty(window, "speechSynthesis", { value: synthesis, configurable: true });
  });
  await page.goto("/");
  await page.getByRole("button", { name: "はじめる", exact: true }).click();
  for (const question of ["だれが？", "いつ？", "どこで？", "なにを？", "どうした？"]) {
    await expect(page.getByRole("heading", { name: question, exact: true })).toBeVisible();
    await page.getByTestId("choice-card").first().click();
  }
  const caster = page.locator(".result-screen .caster");
  const replay = page.getByRole("button", { name: "きく", exact: true });
  const restart = page.getByRole("button", { name: "つぎをつくる", exact: true });
  await expect(caster).toHaveAttribute("data-phase", "preparing");
  await expect(replay).toBeDisabled();
  await expect(restart).toBeEnabled();

  await page.evaluate(() => window.dispatchEvent(new Event("test:speech-start")));
  await expect(caster).toHaveAttribute("data-phase", "speaking");
  await expect(replay).toBeDisabled();
  await expect(restart).toBeEnabled();

  await page.evaluate(() => window.dispatchEvent(new Event("test:speech-end")));
  await expect(caster).toHaveAttribute("data-phase", "idle");
  await expect(replay).toBeEnabled();
  await replay.click();
  await expect(caster).toHaveAttribute("data-phase", "preparing");
  await restart.click();
  await expect(page.getByRole("heading", { name: "だれが？", exact: true })).toBeFocused();
  await page.evaluate(() => window.dispatchEvent(new Event("test:speech-start")));
  await expect(page.locator(".select-screen .caster")).toHaveAttribute("data-phase", "idle");
});

test("settings remain usable on a narrow phone and return focus after saving", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/");
  const settingsButton = page.getByRole("button", { name: "おとな：音声設定", exact: true });
  await settingsButton.click();
  await page.getByLabel("読み上げ方式").selectOption("supertonic");
  const dialog = page.getByRole("dialog", { name: "音声設定", exact: true });
  await expect(dialog).toBeVisible();
  const bounds = await getVisibleBounds(dialog, "Settings dialog has no visible bounds");
  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.y).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(320);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(568);
  await page.screenshot({ path: test.info().outputPath("speech-settings-phone.png") });
  await page.getByRole("button", { name: "設定を保存", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(settingsButton).toBeFocused();
});

test("the settings dialog keeps background controls inert and restores keyboard focus", async ({
  page,
  browserName,
}) => {
  await page.goto("/");
  const settingsButton = page.getByRole("button", { name: "おとな：音声設定", exact: true });
  await settingsButton.click();
  const closeButton = page.getByRole("button", { name: "音声設定を閉じる", exact: true });
  await expect(closeButton).toBeFocused();
  await pressTab(page, browserName);
  await expect(page.getByLabel("読み上げ方式")).toBeFocused();
  await pressTab(page, browserName);
  await expect(page.getByRole("button", { name: "ブラウザーの既定設定に戻す" })).toBeFocused();
  await pressTab(page, browserName);
  const cancelButton = page.getByRole("button", { name: "キャンセル", exact: true });
  await expect(cancelButton).toBeFocused();
  await pressTab(page, browserName);
  await expect(page.getByRole("button", { name: "設定を保存", exact: true })).toBeFocused();
  await pressTab(page, browserName, true);
  await expect(cancelButton).toBeFocused();
  await settingsButton.evaluate((button) => {
    button.focus();
  });
  await expect(cancelButton).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(settingsButton).toBeFocused();
});

test("all model settings and dialog actions stay reachable in phone landscape", async ({
  page,
}) => {
  await page.setViewportSize({ width: 667, height: 375 });
  await page.goto("/");
  await page.getByRole("button", { name: "おとな：音声設定", exact: true }).click();
  await page.getByLabel("読み上げ方式").selectOption("supertonic");
  const dialog = page.getByRole("dialog", { name: "音声設定", exact: true });
  const bounds = await getVisibleBounds(dialog, "The landscape settings dialog must be visible");
  expect(bounds.y).toBeGreaterThanOrEqual(0);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(375);
  await page.getByLabel("モデルのフォルダー").fill("/custom-model/onnx");
  await page.getByLabel("声のJSONファイル").fill("/custom-model/voices/F1.json");
  const save = page.getByRole("button", { name: "設定を保存", exact: true });
  await save.scrollIntoViewIfNeeded();
  await expect(save).toBeInViewport({ ratio: 1 });
  await page.getByRole("button", { name: "キャンセル", exact: true }).click();
  await expect(dialog).toBeHidden();
  await page.getByRole("button", { name: "はじめる" }).click();
  await expect(page.getByRole("heading", { name: "だれが？", exact: true })).toBeVisible();
});

test("invalid model paths show an accessible error and cannot be saved", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "おとな：音声設定", exact: true }).click();
  await page.getByLabel("読み上げ方式").selectOption("supertonic");
  const modelPath = page.getByLabel("モデルのフォルダー");
  await modelPath.fill("javascript:alert(1)");
  await page.getByRole("button", { name: "設定を保存", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(modelPath).toHaveAttribute("aria-invalid", "true");
  await expect(modelPath).toBeFocused();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "おとな：音声設定", exact: true }).click();
  await expect(page.getByLabel("読み上げ方式")).toHaveValue("web-speech");
});
