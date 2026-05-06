import { useRef } from "react";
import { playChoiceSoundFromUserGesture } from "../utils/soundEffects";

export function useButtonSound() {
  const lastPointerSoundAtRef = useRef(0);

  const playOnPressStart: React.PointerEventHandler<HTMLButtonElement> = (event) => {
    if (event.currentTarget.disabled) {
      return;
    }

    lastPointerSoundAtRef.current = performance.now();
    playChoiceSoundFromUserGesture();
  };

  const withClickSound =
    (callback: () => void): React.MouseEventHandler<HTMLButtonElement> =>
    (event) => {
      if (!event.currentTarget.disabled) {
        const now = performance.now();
        const hadRecentPointerSound = now - lastPointerSoundAtRef.current < 500;
        if (!hadRecentPointerSound) {
          playChoiceSoundFromUserGesture();
        }
      }

      callback();
    };

  return { playOnPressStart, withClickSound };
}
