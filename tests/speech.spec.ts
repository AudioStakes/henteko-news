import { expect, test } from "@playwright/test";

declare global {
  interface Window {
    speechWav?: { bytes: number; sampleRate: number; peak: number };
    speechWavError?: string;
  }
}

test("the real Supertonic models produce a non-silent PCM WAV in a production browser", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    const original = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (object) => {
      if (object instanceof Blob && object.type === "audio/wav") {
        object
          .arrayBuffer()
          .then((buffer) => {
            const view = new DataView(buffer);
            let peak = 0;
            for (let offset = 44; offset < buffer.byteLength; offset += 2) {
              peak = Math.max(peak, Math.abs(view.getInt16(offset, true)));
            }
            window.speechWav = {
              bytes: buffer.byteLength,
              sampleRate: view.getUint32(24, true),
              peak,
            };
          })
          .catch((error: unknown) => {
            window.speechWavError =
              error instanceof Error ? error.message : "Unable to inspect generated speech WAV";
          });
      }
      return original(object);
    };
  });
  await page.goto("/");
  await page.getByRole("button", { name: "音声設定", exact: true }).click();
  await page.getByLabel("読み上げ方式").selectOption("supertonic");
  await page.getByRole("button", { name: "設定を保存", exact: true }).click();
  await page.getByRole("button", { name: "ニュースをつくる" }).click();
  for (const label of ["だれが？", "いつ？", "どこで？", "なにを？", "どうした？"]) {
    await expect(page.locator(".speech-select")).toHaveText(label);
    await page.getByTestId("choice-card").first().click();
  }
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          if (window.speechWavError !== undefined) {
            throw new Error(window.speechWavError);
          }
          return window.speechWav?.peak ?? 0;
        }),
      { timeout: 90_000 },
    )
    .toBeGreaterThan(0);
  expect(await page.evaluate(() => window.speechWav)).toMatchObject({ sampleRate: 44_100 });
  expect(errors).toStrictEqual([]);
});
