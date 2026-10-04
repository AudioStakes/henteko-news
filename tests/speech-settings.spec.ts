import { expect, test } from "@playwright/test";
import { getVisibleBounds } from "./helpers";

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
  await page.getByRole("button", { name: "ニュースをつくる" }).click();
  for (const label of ["だれが？", "いつ？", "どこで？", "なにを？", "どうした？"]) {
    await expect(page.locator(".speech-select")).toHaveText(label);
    await page.getByTestId("choice-card").first().click();
  }
  await expect(page.getByRole("button", { name: "もういちどよむ", exact: true })).toBeEnabled();
  const calls = await page.evaluate(() => window.browserSpeechCalls ?? []);
  expect(calls.length).toBeGreaterThan(0);
  expect(calls[0]).toMatchObject({ lang: "ja-JP", rate: 0.75, pitch: 1.25 });
  expect(calls[0]?.text.length).toBeGreaterThan(0);
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
  await page.getByRole("button", { name: "ニュースをつくる" }).click();
  await expect(page.locator(".speech-select")).toHaveText("だれが？");
  await page.getByRole("button", { name: "音声設定", exact: true }).click();
  await expect(page.getByLabel("読み上げ方式")).toHaveValue("web-speech");
  await page.getByLabel("読み上げ方式").selectOption("supertonic");
  await page.getByLabel("モデルのフォルダー").fill("/custom-model/onnx");
  await page.getByLabel("声のJSONファイル").fill("/custom-model/voices/F1.json");
  await page.getByRole("button", { name: "設定を保存", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.locator(".speech-select")).toHaveText("だれが？");

  await page.reload();
  await page.getByRole("button", { name: "音声設定", exact: true }).click();
  await expect(page.getByLabel("読み上げ方式")).toHaveValue("supertonic");
  await expect(page.getByLabel("モデルのフォルダー")).toHaveValue("/custom-model/onnx");
  await expect(page.getByLabel("声のJSONファイル")).toHaveValue("/custom-model/voices/F1.json");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "ニュースをつくる" }).click();
  await expect.poll(() => requested.some((url) => url.endsWith("/onnx/tts.json"))).toBe(true);
  await expect.poll(() => requested.some((url) => url.endsWith("/voices/F1.json"))).toBe(true);

  await page.getByRole("button", { name: "音声設定", exact: true }).click();
  await page.getByLabel("読み上げ方式").selectOption("web-speech");
  await page.getByRole("button", { name: "設定を保存", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: "音声設定", exact: true }).click();
  await expect(page.getByLabel("読み上げ方式")).toHaveValue("web-speech");
  await expect(page.getByLabel("モデルのフォルダー")).toHaveCount(0);
});

test("settings remain usable on a narrow phone and return focus after saving", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto("/");
  const settingsButton = page.getByRole("button", { name: "音声設定", exact: true });
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
