let audioContext: AudioContext | null = null;
let lastPlayedAt = 0;

function getAudioContext(): AudioContext | null {
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

export async function primeChoiceSound(): Promise<void> {
  const context = getAudioContext();
  if (!context) {
    return;
  }

  if (context.state === "suspended") {
    try {
      await context.resume();
    } catch {
      return;
    }
  }

  const buffer = context.createBuffer(1, 1, context.sampleRate);
  const source = context.createBufferSource();
  const gain = context.createGain();

  gain.gain.value = 0.0001;
  source.buffer = buffer;
  source.connect(gain);
  gain.connect(context.destination);

  try {
    source.start();
  } catch {
    // Ignore unlock failures and keep the app interactive.
  }
}

export async function playChoiceSound(): Promise<void> {
  const nowMs = performance.now();
  if (nowMs - lastPlayedAt < 70) {
    return;
  }
  lastPlayedAt = nowMs;

  const context = getAudioContext();
  if (!context) {
    return;
  }

  if (context.state === "suspended") {
    try {
      await context.resume();
    } catch {
      return;
    }
  }

  const now = context.currentTime;
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  let cleanedUp = false;
  const cleanup = () => {
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

  try {
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
    oscillator.stop(now + 0.24);
  } catch (error) {
    cleanup();
    throw error;
  }
}
