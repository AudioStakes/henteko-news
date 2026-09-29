import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ANALYTICS_EVENT_NAMES, setAnalyticsTransport, trackEvent } from "./analytics";

describe("analytics", () => {
  beforeEach(() => {
    setAnalyticsTransport(null);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
    setAnalyticsTransport(null);
  });

  it("does not throw with non-serializable values in payload", () => {
    expect(() => {
      trackEvent(ANALYTICS_EVENT_NAMES.gameStart, {
        ok: true,
        bad: undefined,
        fn: () => "x",
      });
    }).not.toThrow();
  });

  it("does not throw even if transport fails", () => {
    vi.stubEnv("PROD", true);
    setAnalyticsTransport(() => {
      throw new Error("failed");
    });

    expect(() => {
      trackEvent(ANALYTICS_EVENT_NAMES.gameStart, { source: "test" });
    }).not.toThrow();
  });

  it("handles rejected asynchronous transports without an unhandled rejection", async () => {
    vi.stubEnv("PROD", true);
    const transport = vi.fn().mockRejectedValue(new Error("offline"));
    setAnalyticsTransport(transport);
    trackEvent(ANALYTICS_EVENT_NAMES.gameStart);
    await Promise.resolve();
    expect(transport).toHaveBeenCalledTimes(1);
  });

  it("debug logging path is safe in development", () => {
    const spy = vi.spyOn(console, "debug").mockImplementation(() => undefined);
    trackEvent(ANALYTICS_EVENT_NAMES.gameStart, { source: "dev" });
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });
});
