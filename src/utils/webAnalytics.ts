const BEACON_SOURCE = "https://static.cloudflareinsights.com/beacon.min.js";

export function initializeWebAnalytics(token: string) {
  if (
    !import.meta.env.PROD ||
    window.location.hostname !== "henteko-news.netlify.app" ||
    document.querySelector(`script[src="${BEACON_SOURCE}"]`)
  ) {
    return;
  }

  const script = document.createElement("script");
  script.type = "module";
  script.async = true;
  script.fetchPriority = "low";
  script.src = BEACON_SOURCE;
  script.dataset["cfBeacon"] = JSON.stringify({ token });
  document.body.append(script);
}
