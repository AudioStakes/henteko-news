import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { initializeWebAnalytics } from "./webAnalytics";

const BEACON_SELECTOR = 'script[src="https://static.cloudflareinsights.com/beacon.min.js"]';

describe("Cloudflare Web Analytics", () => {
  beforeEach(() => {
    vi.stubEnv("PROD", true);
    vi.stubGlobal("location", new URL("https://henteko-news.netlify.app/"));
  });

  afterEach(() => {
    document.body.replaceChildren();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("loads one nonblocking beacon with the public site token on the production hostname", () => {
    initializeWebAnalytics("public-site-token");
    initializeWebAnalytics("public-site-token");

    expect(document.querySelectorAll(BEACON_SELECTOR)).toHaveLength(1);
    const script = document.querySelector(BEACON_SELECTOR);
    expect(script).toHaveAttribute("type", "module");
    expect(script).toHaveProperty("async", true);
    expect(script).toHaveProperty("fetchPriority", "low");
    expect(script).toHaveAttribute("data-cf-beacon", '{"token":"public-site-token"}');
  });

  it.each([
    "http://localhost:5173/",
    "http://127.0.0.1:4175/",
    "https://deploy-preview-42--henteko-news.netlify.app/",
    "https://feature--henteko-news.netlify.app/",
    "https://copy.henteko-news.netlify.app/",
  ])("does not load the production beacon on %s", (url) => {
    vi.stubGlobal("location", new URL(url));

    initializeWebAnalytics("public-site-token");

    expect(document.querySelector(BEACON_SELECTOR)).toBeNull();
  });

  it("does not load the beacon in development even with the production hostname", () => {
    vi.stubEnv("PROD", false);

    initializeWebAnalytics("public-site-token");

    expect(document.querySelector(BEACON_SELECTOR)).toBeNull();
  });
});
