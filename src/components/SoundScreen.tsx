import { useButtonSound } from "../hooks/useButtonSound";
import type { SoundSettings } from "../types/game";

type SoundScreenProps = {
  settings: SoundSettings;
  onUpdate: (next: SoundSettings) => void;
  onBack: () => void;
};
export function SoundScreen({ settings, onUpdate, onBack }: SoundScreenProps) {
  const { primeOnPressStart, withClickSound } = useButtonSound();
  return (
    <section className="screen sound-screen">
      <div className="sound-card">
        <h1>こえ</h1>
        <div className="sound-list">
          <p className="sound-label">よみあげ</p>
          <div className="sound-row two sound-toggle">
            <button
              type="button"
              aria-pressed={settings.enabled}
              className={settings.enabled ? "sound-choice active" : "sound-choice"}
              onClick={withClickSound(() => onUpdate({ ...settings, enabled: true }))}
              onPointerDown={primeOnPressStart}
            >
              オン
            </button>
            <button
              type="button"
              aria-pressed={!settings.enabled}
              className={
                !settings.enabled ? "sound-choice active sound-choice-off" : "sound-choice"
              }
              onClick={withClickSound(() => onUpdate({ ...settings, enabled: false }))}
              onPointerDown={primeOnPressStart}
            >
              オフ
            </button>
          </div>
        </div>
        <button
          type="button"
          className="action-btn orange small sound-confirm"
          onClick={withClickSound(onBack)}
          onPointerDown={primeOnPressStart}
        >
          <span>けってい</span>
        </button>
      </div>
    </section>
  );
}
