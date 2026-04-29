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

  if (context.state === 'suspended') {
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
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(580, now);
    oscillator.frequency.exponentialRampToValueAtTime(920, now + 0.07);
    oscillator.frequency.exponentialRampToValueAtTime(700, now + 0.15);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.12, now + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

    oscillator.connect(gain);
    gain.connect(context.destination);

    oscillator.start(now);
    oscillator.stop(now + 0.2);
  } catch (error) {
    cleanup();
    throw error;
  }
}
