export const ANALYTICS_EVENT_NAMES = {
  gameStart: "game_start",
  speechSupported: "speech_supported",
  speechUnsupported: "speech_unsupported",
  speechError: "speech_error",
  offlineDetected: "offline_detected",
  onlineRestored: "online_restored",
  serviceWorkerError: "service_worker_error",
} as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENT_NAMES)[keyof typeof ANALYTICS_EVENT_NAMES];

export type AnalyticsPayload = Record<string, unknown>;

type AnalyticsEntry = {
  type: "event" | "error";
  name: AnalyticsEventName;
  payload?: AnalyticsPayload;
  timestamp: number;
};

type AnalyticsTransport = (entry: AnalyticsEntry) => void | Promise<void>;

const isProd = import.meta.env.PROD;

let transport: AnalyticsTransport | null = null;

function sanitizePayload(payload?: AnalyticsPayload): AnalyticsPayload | undefined {
  if (!payload) return undefined;

  const sanitized = Object.fromEntries(
    Object.entries(payload).filter(([, value]) => {
      if (value === undefined) return false;
      return ["string", "number", "boolean", "object"].includes(typeof value) || value === null;
    }),
  );

  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}

function createEntry(
  type: "event" | "error",
  name: AnalyticsEventName,
  payload?: AnalyticsPayload,
) {
  return {
    type,
    name,
    payload: sanitizePayload(payload),
    timestamp: Date.now(),
  } satisfies AnalyticsEntry;
}

function emit(entry: AnalyticsEntry) {
  try {
    if (!isProd) {
      if (import.meta.env.DEV) {
        console.debug("[analytics]", entry);
      }
      return;
    }

    void transport?.(entry);
  } catch {
    // analytics errors must never affect UX
  }
}

export function setAnalyticsTransport(nextTransport: AnalyticsTransport | null) {
  transport = nextTransport;
}

export function trackEvent(name: AnalyticsEventName, payload?: AnalyticsPayload) {
  emit(createEntry("event", name, payload));
}

export function trackError(name: AnalyticsEventName, payload?: AnalyticsPayload) {
  emit(createEntry("error", name, payload));
}
