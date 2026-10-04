import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type TensorStub = { data?: Float32Array | Float64Array };
type SessionStub = {
  release: () => Promise<void>;
  run?: () => Promise<Record<string, TensorStub>>;
};

const { createSession } = vi.hoisted(() => ({
  createSession: vi.fn<(path: string) => Promise<SessionStub>>(),
}));
vi.mock("onnxruntime-web/wasm", () => ({
  env: { wasm: {} },
  Tensor: vi.fn(),
  InferenceSession: { create: createSession },
}));

describe("Supertonic initialization", () => {
  let rejectVoiceOnce = false;
  const assetPath = (input: RequestInfo | URL) =>
    typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  const fetchAsset = vi.fn((input: RequestInfo | URL) => {
    const path = assetPath(input);
    if (path.endsWith("M1.json") || path.endsWith("F2.json")) {
      if (rejectVoiceOnce) {
        rejectVoiceOnce = false;
        return Promise.resolve({ ok: false, status: 404 });
      }
      const style = { dims: [1, 1, 1], data: [[[0]]] };
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ style_ttl: style, style_dp: style }),
      });
    }
    const data = path.endsWith("tts.json")
      ? {
          ae: { sample_rate: 44_100, base_chunk_size: 512 },
          ttl: { latent_dim: 24, chunk_compress_factor: 6 },
        }
      : [];
    return Promise.resolve({ ok: true, json: () => Promise.resolve(data) });
  });

  beforeEach(() => {
    vi.resetModules();
    rejectVoiceOnce = false;
    fetchAsset.mockClear();
    createSession.mockReset().mockResolvedValue({ release: vi.fn(() => Promise.resolve()) });
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
    expect(
      fetchAsset.mock.calls.filter(([path]) => assetPath(path).endsWith("M1.json")),
    ).toHaveLength(1);
  });

  it("retries a failed voice style without reloading successful models", async () => {
    rejectVoiceOnce = true;
    const { preloadSupertonic } = await import("./supertonicClient");
    await expect(preloadSupertonic()).rejects.toThrow("HTTP 404");
    await expect(preloadSupertonic()).resolves.toBeUndefined();
    expect(
      fetchAsset.mock.calls.filter(([path]) => assetPath(path).endsWith("M1.json")),
    ).toHaveLength(2);
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
    expect(createSession.mock.calls.map(([path]) => path)).toStrictEqual([
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
    createSession.mockImplementation((path: string) =>
      Promise.resolve({
        release: vi.fn(() => Promise.resolve()),
        run: vi.fn<() => Promise<Record<string, TensorStub>>>(() => {
          if (path.endsWith("duration_predictor.onnx")) {
            return Promise.resolve({ duration: { data: new Float32Array([0.001]) } });
          }
          if (path.endsWith("text_encoder.onnx")) {
            return Promise.resolve({ text_emb: {} });
          }
          if (path.endsWith("vector_estimator.onnx")) {
            return Promise.resolve({ denoised_latent: { data: new Float32Array([0]) } });
          }
          return Promise.resolve({ wav_tts: { data: new Float32Array([0, 0]) } });
        }),
      }),
    );
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

  it.each([
    { name: "missing", output: {} },
    { name: "wrong datatype", output: { duration: { data: new Float64Array([0.001]) } } },
  ])("rejects $name duration tensors instead of trusting model output", async ({ output }) => {
    createSession.mockResolvedValue({
      release: vi.fn(() => Promise.resolve()),
      run: vi.fn<() => Promise<Record<string, TensorStub>>>().mockResolvedValue(output),
    });
    const { synthesizeSupertonicSpeech } = await import("./supertonicClient");
    await expect(synthesizeSupertonicSpeech({ text: "こんにちは" })).rejects.toThrow(
      "duration tensor",
    );
  });

  it("releases old model sessions when the retained directory limit is exceeded", async () => {
    const releases: ReturnType<typeof vi.fn<() => Promise<void>>>[] = [];
    createSession.mockImplementation(() => {
      const release = vi.fn(() => Promise.resolve());
      releases.push(release);
      return Promise.resolve({ release });
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
    const releases = new Map<string, ReturnType<typeof vi.fn<() => Promise<void>>>>();
    let finishDuration: ((value: { duration: { data: Float32Array } }) => void) | undefined;
    let started: (() => void) | undefined;
    const firstStarted = new Promise<void>((resolve) => {
      started = resolve;
    });
    createSession.mockImplementation((path: string) => {
      const release = vi.fn(() => Promise.resolve());
      releases.set(path, release);
      return Promise.resolve({
        release,
        run: vi.fn<() => Promise<Record<string, TensorStub>>>(() => {
          if (path === "/one/duration_predictor.onnx") {
            if (!started) {
              throw new Error("The synthesis start observer is not initialized");
            }
            started();
            return new Promise<{ duration: { data: Float32Array } }>((resolve) => {
              finishDuration = resolve;
            });
          }
          if (path.endsWith("text_encoder.onnx")) {
            return Promise.resolve({ text_emb: {} });
          }
          if (path.endsWith("vector_estimator.onnx")) {
            return Promise.resolve({ denoised_latent: { data: new Float32Array([0]) } });
          }
          return Promise.resolve({ wav_tts: { data: new Float32Array([0]) } });
        }),
      });
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
    if (!finishDuration) {
      throw new Error("The duration predictor has not started");
    }
    finishDuration({ duration: { data: new Float32Array([0.001]) } });
    await expect(pending).resolves.toMatchObject({ url: "blob:active" });
  });
});
