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
    if (path.endsWith("M1.json") || path.endsWith("F2.json")) {
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

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

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
    expect(fetchAsset.mock.calls.filter(([path]) => String(path).endsWith("M1.json"))).toHaveLength(
      1,
    );
  });

  it("retries a failed voice style without reloading successful models", async () => {
    rejectVoiceOnce = true;
    const { preloadSupertonic } = await import("./supertonicClient");
    await expect(preloadSupertonic()).rejects.toThrow("HTTP 404");
    await expect(preloadSupertonic()).resolves.toBeUndefined();
    expect(fetchAsset.mock.calls.filter(([path]) => String(path).endsWith("M1.json"))).toHaveLength(
      2,
    );
    expect(createSession).toHaveBeenCalledTimes(4);
  });

  it("coalesces configured models and loads a newly selected directory and voice", async () => {
    const { preloadSupertonic } = await import("./supertonicClient");
    const settings = {
      modelBasePath: "https://models.example/custom/onnx/",
      voiceStylePath: "https://models.example/voices/F2.json",
    };
    await Promise.all([preloadSupertonic(settings), preloadSupertonic(settings)]);
    expect(createSession).toHaveBeenCalledTimes(4);
    expect(createSession.mock.calls.map(([path]) => path)).toEqual([
      "https://models.example/custom/onnx/duration_predictor.onnx",
      "https://models.example/custom/onnx/text_encoder.onnx",
      "https://models.example/custom/onnx/vector_estimator.onnx",
      "https://models.example/custom/onnx/vocoder.onnx",
    ]);
    expect(fetchAsset).toHaveBeenCalledWith(settings.voiceStylePath, expect.any(Object));
    await preloadSupertonic();
    expect(createSession.mock.lastCall?.[0]).toBe("/supertonic/onnx/vocoder.onnx");
    expect(fetchAsset).toHaveBeenCalledWith("/supertonic/voice_styles/M1.json", expect.any(Object));
  });

  it("uses configured assets during synthesis and reuses their warmup", async () => {
    const settings = { modelBasePath: "/custom/onnx", voiceStylePath: "/voices/F2.json" };
    createSession.mockImplementation(async (path: string) => ({
      release: vi.fn(),
      run: vi.fn(async () => {
        if (path.endsWith("duration_predictor.onnx")) {
          return { duration: { data: new Float32Array([0.001]) } };
        }
        if (path.endsWith("text_encoder.onnx")) return { text_emb: {} };
        if (path.endsWith("vector_estimator.onnx")) {
          return { denoised_latent: { data: new Float32Array([0]) } };
        }
        return { wav_tts: { data: new Float32Array([0, 0]) } };
      }),
    }));
    const createUrl = vi.fn(() => "blob:configured");
    const revokeUrl = vi.fn();
    vi.spyOn(URL, "createObjectURL").mockImplementation(createUrl);
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(revokeUrl);
    const { preloadSupertonic, synthesizeSupertonicSpeech } = await import("./supertonicClient");
    await preloadSupertonic(settings);
    const result = await synthesizeSupertonicSpeech({ text: "こんにちは", ...settings });
    expect(createSession).toHaveBeenCalledTimes(4);
    expect(fetchAsset).toHaveBeenCalledTimes(3);
    expect(result.url).toBe("blob:configured");
    result.revoke();
    expect(revokeUrl).toHaveBeenCalledWith("blob:configured");
  });

  it("releases old model sessions when the retained directory limit is exceeded", async () => {
    const releases: ReturnType<typeof vi.fn>[] = [];
    createSession.mockImplementation(async () => {
      const release = vi.fn();
      releases.push(release);
      return { release };
    });
    const { preloadSupertonic } = await import("./supertonicClient");
    for (const modelBasePath of ["/one", "/two", "/three"]) {
      await preloadSupertonic({ modelBasePath, voiceStylePath: "/voices/M1.json" });
    }
    await Promise.resolve();
    expect(releases.slice(0, 4).every((release) => release.mock.calls.length === 1)).toBe(true);
    expect(releases.slice(4).every((release) => release.mock.calls.length === 0)).toBe(true);
  });

  it("keeps sessions owned by an in-flight synthesis while evicting an idle model", async () => {
    const releases = new Map<string, ReturnType<typeof vi.fn>>();
    let finishDuration!: (value: { duration: { data: Float32Array } }) => void;
    let started!: () => void;
    const firstStarted = new Promise<void>((resolve) => {
      started = resolve;
    });
    createSession.mockImplementation(async (path: string) => {
      const release = vi.fn();
      releases.set(path, release);
      return {
        release,
        run: vi.fn(async () => {
          if (path === "/one/duration_predictor.onnx") {
            started();
            return new Promise((resolve) => {
              finishDuration = resolve;
            });
          }
          if (path.endsWith("text_encoder.onnx")) return { text_emb: {} };
          if (path.endsWith("vector_estimator.onnx")) {
            return { denoised_latent: { data: new Float32Array([0]) } };
          }
          return { wav_tts: { data: new Float32Array([0]) } };
        }),
      };
    });
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:active");
    const { preloadSupertonic, synthesizeSupertonicSpeech } = await import("./supertonicClient");
    const pending = synthesizeSupertonicSpeech({ text: "こんにちは", modelBasePath: "/one" });
    await firstStarted;
    for (const modelBasePath of ["/two", "/three"]) {
      await preloadSupertonic({ modelBasePath, voiceStylePath: "/voices/M1.json" });
    }
    await Promise.resolve();
    expect(releases.get("/one/duration_predictor.onnx")).not.toHaveBeenCalled();
    expect(releases.get("/two/duration_predictor.onnx")).toHaveBeenCalledTimes(1);
    expect(releases.get("/three/duration_predictor.onnx")).not.toHaveBeenCalled();
    finishDuration({ duration: { data: new Float32Array([0.001]) } });
    await expect(pending).resolves.toMatchObject({ url: "blob:active" });
  });
});
