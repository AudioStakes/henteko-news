import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("onnxruntime-web/wasm", () => ({ env: { wasm: {} } }));

import { loadTextToSpeech, loadVoiceStyle, preprocessSpeechText, writeWavFile } from "./helper";

describe("Supertonic input and asset handling", () => {
  beforeEach(() => vi.unstubAllGlobals());

  it("adds both language tags and final punctuation required by the model", () => {
    expect(preprocessSpeechText("こんにちは", "ja")).toBe("<ja>こんにちは.</ja>");
    expect(preprocessSpeechText(" ニュースです！ ", "ja")).toBe("<ja>ニュースです!</ja>");
  });

  it("rejects missing model configuration with the path and HTTP status", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    await expect(loadTextToSpeech("/models")).rejects.toThrow("HTTP 404");
  });

  it("rejects a missing voice style instead of parsing an HTML fallback", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404 }));
    await expect(loadVoiceStyle(["/voices/M1.json"])).rejects.toThrow("/voices/M1.json");
  });

  it("rejects malformed model configuration before loading inference sessions", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ ae: {}, ttl: {} }) }),
    );
    await expect(loadTextToSpeech("/models")).rejects.toThrow("Invalid speech model configuration");
  });

  it("rejects voice data that does not match its declared tensor dimensions", async () => {
    const style = { dims: [1, 1, 2], data: [[[0]]] };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ style_ttl: style, style_dp: style }),
      }),
    );
    await expect(loadVoiceStyle(["/voices/M1.json"])).rejects.toThrow(
      "Invalid voice style tensor dimensions",
    );
  });

  it("writes a correctly sized mono PCM WAV and clips out-of-range samples", async () => {
    const blob = writeWavFile([-2, 0, 2], 44_100);
    const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(reader.result);
        } else {
          reject(new Error("Expected WAV bytes from FileReader"));
        }
      };
      reader.onerror = () => {
        reject(reader.error ?? new Error("Failed to read WAV bytes"));
      };
      reader.readAsArrayBuffer(blob);
    });
    const view = new DataView(buffer);
    expect(buffer.byteLength).toBe(50);
    expect(view.getUint32(24, true)).toBe(44_100);
    expect(view.getUint32(40, true)).toBe(6);
    expect([
      view.getInt16(44, true),
      view.getInt16(46, true),
      view.getInt16(48, true),
    ]).toStrictEqual([-32768, 0, 32767]);
  });
});
