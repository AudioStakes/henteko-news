import { playChoiceSound, primeChoiceSound } from "../utils/soundEffects";

export function useButtonSound() {
  const primeOnPressStart = () => {
    void primeChoiceSound().catch(() => {
      // iOS Safari may reject unlock attempts; try again on actual tap.
    });
  };

  const withClickSound = (callback: () => void) => () => {
    void playChoiceSound().catch(() => {
      // Keep controls responsive even when sound playback fails.
    });
    callback();
  };

  return { primeOnPressStart, withClickSound };
}
