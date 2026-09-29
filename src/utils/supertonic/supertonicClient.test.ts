import { beforeEach, describe, expect, it, vi } from "vitest";

const { loadTts, loadStyle } = vi.hoisted(() => ({ loadTts: vi.fn(), loadStyle: vi.fn() }));
vi.mock("./helper", () => ({ loadTextToSpeech: loadTts, loadVoiceStyle: loadStyle }));

describe("Supertonic initialization", () => {
  beforeEach(() => {
    vi.resetModules();
    loadTts.mockReset().mockResolvedValue({ textToSpeech: {} });
    loadStyle.mockReset().mockResolvedValue({});
  });

  it("coalesces concurrent warmup attempts", async () => {
    const { preloadSupertonic } = await import("./supertonicClient");
    await Promise.all([preloadSupertonic(), preloadSupertonic()]);
    expect(loadTts).toHaveBeenCalledTimes(1);
    expect(loadStyle).toHaveBeenCalledTimes(1);
  });

  it("retries model initialization after a temporary failure", async () => {
    loadTts.mockRejectedValueOnce(new Error("offline"));
    const { preloadSupertonic } = await import("./supertonicClient");
    await expect(preloadSupertonic()).rejects.toThrow("offline");
    await expect(preloadSupertonic()).resolves.toBeUndefined();
    expect(loadTts).toHaveBeenCalledTimes(2);
  });

  it("retries a failed voice style without reloading successful models", async () => {
    loadStyle.mockRejectedValueOnce(new Error("voice missing"));
    const { preloadSupertonic } = await import("./supertonicClient");
    await expect(preloadSupertonic()).rejects.toThrow("voice missing");
    await expect(preloadSupertonic()).resolves.toBeUndefined();
    expect(loadStyle).toHaveBeenCalledTimes(2);
    expect(loadTts).toHaveBeenCalledTimes(1);
  });
});
