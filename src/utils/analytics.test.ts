import { beforeEach, describe, expect, it, vi } from "vitest";
import { ANALYTICS_EVENT_NAMES, setAnalyticsTransport, trackEvent } from "./analytics";

describe("analytics", () => {
  beforeEach(() => {
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
    setAnalyticsTransport(() => {
      throw new Error("failed");
    });

    expect(() => {
      trackEvent(ANALYTICS_EVENT_NAMES.gameStart, { source: "test" });
    }).not.toThrow();
  });

  it("debug logging path is safe in development", () => {
    const spy = vi.spyOn(console, "debug").mockImplementation(() => undefined);
    trackEvent(ANALYTICS_EVENT_NAMES.gameStart, { source: "dev" });
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });
});
