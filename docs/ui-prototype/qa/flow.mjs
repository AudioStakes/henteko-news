import assert from "node:assert/strict";
import { expect } from "../../../node_modules/@playwright/test/index.mjs";

export async function run({ page, baseURL, step }) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const preview = async (key) => {
    await page.locator("#preview-details").evaluate((element) => {
      element.open = true;
    });
    await page.locator(`[data-preview="${key}"]`).click();
    await page
      .locator("#screen .caster img")
      .evaluateAll((images) => Promise.all(images.map((image) => image.decode())));
  };
  const noOverflow = async () => {
    const sizes = await page.evaluate(() => ({
      width: innerWidth,
      content: document.documentElement.scrollWidth,
    }));
    assert.ok(sizes.content <= sizes.width, `Horizontal overflow: ${JSON.stringify(sizes)}`);
  };
  const choices = page.locator("#screen .choice");
  await step("トップの素材・開始操作", async () => {
    await page.goto(baseURL);
    await page.evaluate(() => document.fonts.ready);
    await expect(page.getByRole("button", { name: "はじめる", exact: true })).toBeVisible();
    const images = await page
      .locator(".brand img, .caster img")
      .evaluateAll((elements) =>
        elements.every((image) => image.complete && image.naturalWidth > 0),
      );
    assert.equal(images, true);
    await noOverflow();
    await page.getByRole("button", { name: "はじめる", exact: true }).click();
    await expect(page.getByRole("heading", { name: "だれが？", exact: true })).toBeVisible();
    await expect(choices).toHaveCount(5);
    await page.locator(".caster img").evaluate((image) => image.decode());
  });
  await step("5種類の選択・連打防止・敬体の完成文", async () => {
    await choices.first().evaluate((button) => {
      button.click();
      document.querySelector("#screen .choice").click();
    });
    await expect(page.getByRole("heading", { name: "いつ？", exact: true })).toBeVisible();
    for (const next of ["どこで？", "なにを？", "どうした？"]) {
      await choices.first().click();
      await expect(page.getByRole("heading", { name: next, exact: true })).toBeVisible();
    }
    await choices.first().click();
    await expect(page.locator(".news-line")).toHaveText([
      "ねこが",
      "きのうのよる",
      "こうえんで",
      "おにぎりを",
      "たべました！",
    ]);
    await expect(page.locator('[data-command="replay"]')).toBeDisabled();
    assert.equal(await page.getByText("きみのニュース", { exact: true }).count(), 0);
  });
  await step("準備中・読み上げ中のフォーカス維持", async () => {
    await expect(page.locator(".news")).toBeFocused();
    await expect(page.locator(".caster-status")).toHaveText("よんでいるよ");
    await expect(page.locator(".news")).toBeFocused();
    await page.locator('[data-command="start"]').focus();
    await expect(page.locator('[data-command="start"]')).toBeFocused();
    await expect(page.locator('[data-command="replay"]')).toBeEnabled({ timeout: 6500 });
    await expect(page.locator('[data-command="start"]')).toBeFocused();
  });
  await step("処理中の次作成と古いタイマー取消", async () => {
    await page.locator('[data-command="replay"]').click();
    await expect(page.locator(".caster-status")).toHaveText("じゅんび中");
    await expect(page.locator('[data-command="start"]')).toBeEnabled();
    await page.locator('[data-command="start"]').click();
    await expect(page.getByRole("heading", { name: "だれが？", exact: true })).toBeVisible();
    await page.waitForTimeout(4400);
    await expect(page.getByRole("heading", { name: "だれが？", exact: true })).toBeVisible();
  });
  await step("設定の入力エラー・取消・保存・既定値", async () => {
    await choices.first().click();
    await expect(page.getByRole("heading", { name: "いつ？", exact: true })).toBeVisible();
    const opener = page.getByRole("button", { name: "おとな", exact: true });
    await opener.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await page.getByLabel("読み上げ方式", { exact: true }).selectOption("supertonic");
    await page.getByLabel("モデルのフォルダー", { exact: true }).fill("/supertonic/onnx?x=1");
    await page.getByLabel("声のJSONファイル", { exact: true }).fill("ftp://voice.json");
    await page.getByRole("button", { name: "設定を保存", exact: true }).click();
    await expect(page.locator("#model-error")).toBeVisible();
    await expect(page.locator("#voice-error")).toBeVisible();
    await page.getByRole("button", { name: "キャンセル", exact: true }).click();
    await expect(opener).toBeFocused();
    await expect(page.getByRole("heading", { name: "いつ？", exact: true })).toBeVisible();
    await opener.click();
    await expect(page.getByLabel("読み上げ方式", { exact: true })).toHaveValue("web-speech");
    await page.getByLabel("読み上げ方式", { exact: true }).selectOption("supertonic");
    await page.getByLabel("モデルのフォルダー", { exact: true }).fill(" /supertonic/onnx ");
    await page
      .getByLabel("声のJSONファイル", { exact: true })
      .fill("/supertonic/voice_styles/M1.json?demo=1");
    await page.getByRole("button", { name: "設定を保存", exact: true }).click();
    await expect(dialog).not.toBeVisible();
    await opener.click();
    await expect(page.getByLabel("読み上げ方式", { exact: true })).toHaveValue("supertonic");
    await expect(page.getByLabel("モデルのフォルダー", { exact: true })).toHaveValue(
      "/supertonic/onnx",
    );
    await page.getByRole("button", { name: "ブラウザーの既定設定に戻す", exact: true }).click();
    await page.keyboard.press("Escape");
    await opener.click();
    await expect(page.getByLabel("読み上げ方式", { exact: true })).toHaveValue("supertonic");
    await page.keyboard.press("Escape");
    await expect(opener).toBeFocused();
  });
  await step("音声エラー・非対応・オフラインから継続", async () => {
    await preview("error");
    await expect(page.locator(".error-note")).toContainText("こえが でなかったよ");
    await expect(page.locator('[data-command="replay"]')).toBeEnabled();
    await preview("unsupported");
    await expect(page.locator('[data-command="replay"]')).toBeDisabled();
    await page.locator('[data-command="start"]').click();
    await expect(choices).toHaveCount(5);
    await preview("offline");
    await expect(page.locator("#offline-notice")).toBeVisible();
    await choices.first().click();
    await expect(page.getByRole("heading", { name: "いつ？", exact: true })).toBeVisible();
    await expect(page.locator("#offline-notice")).toBeVisible();
  });
  await step("全20状態の表示と素材・横溢れ", async () => {
    await page.locator("#preview-details").evaluate((element) => {
      element.open = true;
    });
    const keys = await page
      .locator("[data-preview]")
      .evaluateAll((elements) => elements.map((element) => element.dataset.preview));
    assert.equal(keys.length, 20);
    for (const key of keys) {
      await preview(key);
      if (key.startsWith("settings-")) {
        await expect(page.getByRole("dialog")).toBeVisible();
        await page.keyboard.press("Escape");
      } else {
        await expect(page.locator("#screen h1")).toBeVisible();
      }
      await noOverflow();
    }
    await expect(page.locator(".news-line").last()).toHaveText("ひやしました！");
  });
  await step("開発者用8操作の模擬状態", async () => {
    await preview("developer-idle");
    await expect(page.locator(".developer-controls button")).toHaveCount(8);
    await page.getByRole("button", { name: "最初から", exact: true }).click();
    await expect(page.getByRole("button", { name: "停止", exact: true })).toBeEnabled();
    assert.equal(await page.locator(".developer-controls button:enabled").count(), 1);
    await page.getByRole("button", { name: "停止", exact: true }).click();
    await expect(page.getByRole("button", { name: "続きから", exact: true })).toBeEnabled();
  });
  await step("スマホ幅・横向き・デスクトップの可読性", async () => {
    for (const [width, height] of [
      [320, 568],
      [390, 844],
      [844, 390],
      [1280, 720],
    ]) {
      await page.setViewportSize({ width, height });
      for (const key of ["start", "step0", "long-choices", "long-result"]) {
        await preview(key);
        await noOverflow();
        const controls = await page.locator("#screen button").evaluateAll((buttons) =>
          buttons.map((button) => ({
            width: button.getBoundingClientRect().width,
            height: button.getBoundingClientRect().height,
          })),
        );
        assert.ok(controls.every((control) => control.width >= 44 && control.height >= 44));
      }
      await preview("step0");
      await choices.last().click();
      await expect(page.getByRole("heading", { name: "いつ？", exact: true })).toBeVisible();
      const question = await page.locator(".question").boundingBox();
      assert.ok(
        question.y >= 0 && question.y + question.height <= height,
        `Next question must scroll into view: ${JSON.stringify({ width, height, question })}`,
      );
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await preview("start");
    assert.deepEqual(errors, []);
  });
}
