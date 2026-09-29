import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { createSession } = vi.hoisted(() => ({ createSession: vi.fn() }));
vi.mock("onnxruntime-web/wasm", () => ({
  env: { wasm: {} },
  Tensor: vi.fn(),
  InferenceSession: { create: createSession },
}));

describe("Supertonic initialization", () => {
  let rejectVoiceOnce = false;
  const fetchAsset = vi.fn(async (input: RequestInfo | URL) => {
    const path = String(input);
    if (path.endsWith("M1.json")) {
      if (rejectVoiceOnce) {
        rejectVoiceOnce = false;
        return { ok: false, status: 404 };
      }
      const style = { dims: [1, 1, 1], data: [[[0]]] };
      return { ok: true, json: async () => ({ style_ttl: style, style_dp: style }) };
    }
    const data = path.endsWith("tts.json")
      ? {
          ae: { sample_rate: 44_100, base_chunk_size: 512 },
          ttl: { latent_dim: 24, chunk_compress_factor: 6 },
        }
      : [];
    return { ok: true, json: async () => data };
  });

  beforeEach(() => {
    vi.resetModules();
    rejectVoiceOnce = false;
    fetchAsset.mockClear();
    createSession.mockReset().mockResolvedValue({ release: vi.fn() });
    vi.stubGlobal("fetch", fetchAsset);
  });

  afterEach(() => vi.unstubAllGlobals());

  it("coalesces concurrent warmup attempts", async () => {
    const { preloadSupertonic } = await import("./supertonicClient");
    await Promise.all([preloadSupertonic(), preloadSupertonic()]);
    expect(createSession).toHaveBeenCalledTimes(4);
    expect(fetchAsset).toHaveBeenCalledTimes(3);
  });

  it("retries model initialization after a temporary failure", async () => {
    createSession.mockRejectedValueOnce(new Error("offline"));
    const { preloadSupertonic } = await import("./supertonicClient");
    await expect(preloadSupertonic()).rejects.toThrow("offline");
    await expect(preloadSupertonic()).resolves.toBeUndefined();
    expect(createSession).toHaveBeenCalledTimes(5);
    expect(
      fetchAsset.mock.calls.filter(([path]) => String(path).endsWith("M1.json")),
    ).toHaveLength(1);
  });

  it("retries a failed voice style without reloading successful models", async () => {
    rejectVoiceOnce = true;
    const { preloadSupertonic } = await import("./supertonicClient");
    await expect(preloadSupertonic()).rejects.toThrow("HTTP 404");
    await expect(preloadSupertonic()).resolves.toBeUndefined();
    expect(
      fetchAsset.mock.calls.filter(([path]) => String(path).endsWith("M1.json")),
    ).toHaveLength(2);
    expect(createSession).toHaveBeenCalledTimes(4);
  });
});
