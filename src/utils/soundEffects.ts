let audioContext: AudioContext | null = null;
let lastPlayedAt = 0;
const CHOICE_SOUND_DEBOUNCE_MS = 70;
const CHOICE_SOUND_DURATION_SECONDS = 0.24;

function warnInDevelopment(message: string, error?: unknown) {
  if (!import.meta.env.DEV) {
    return;
  }

  if (error) {
    console.warn(message, error);
    return;
  }

  console.warn(message);
}

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") {
    return null;
  }

  const AudioContextClass =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioContextClass) {
    return null;
  }

  if (!audioContext) {
    audioContext = new AudioContextClass();
  }

  return audioContext;
}

export function playChoiceSoundFromUserGesture(): void {
  let cleanup: (() => void) | undefined;

  try {
    const nowMs = performance.now();
    if (nowMs - lastPlayedAt < CHOICE_SOUND_DEBOUNCE_MS) {
      return;
    }
    lastPlayedAt = nowMs;

    const context = getAudioContext();
    if (!context) {
      return;
    }

    // iOS/WebKit can require playback to start inside the original user activation,
    // so we resume and schedule the sound synchronously from the gesture handler.
    if (context.state === "suspended") {
      void context.resume().catch((error) => {
        warnInDevelopment("Failed to resume AudioContext for button sound.", error);
      });
    }

    const now = context.currentTime;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    let cleanedUp = false;
    cleanup = () => {
      if (cleanedUp) {
        return;
      }
      cleanedUp = true;

      try {
        oscillator.disconnect();
      } catch {
        // Ignore disconnect errors during cleanup.
      }

      try {
        gain.disconnect();
      } catch {
        // Ignore disconnect errors during cleanup.
      }
    };

    oscillator.onended = cleanup;

    oscillator.type = "triangle";
    oscillator.frequency.setValueAtTime(620, now);
    oscillator.frequency.exponentialRampToValueAtTime(960, now + 0.08);
    oscillator.frequency.exponentialRampToValueAtTime(740, now + 0.18);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.016);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start(now);
    oscillator.stop(now + CHOICE_SOUND_DURATION_SECONDS);
  } catch (error) {
    cleanup?.();
    warnInDevelopment("Failed to play button sound.", error);
    return;
  }
}
