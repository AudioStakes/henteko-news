import { useButtonSound } from "../hooks/useButtonSound";
import type { SoundSettings } from "../types/game";

const SPEED_OPTIONS = [
  { value: "slow", label: "ゆっくり" },
  { value: "normal", label: "ふつう" },
  { value: "fast", label: "はやい" },
  { value: "veryFast", label: "すごくはやい" },
] as const satisfies ReadonlyArray<{ value: SoundSettings["speed"]; label: string }>;
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
        <div className="sound-list">
          <p className="sound-label">はやさ</p>
          <div className="sound-row one">
            {SPEED_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={settings.speed === option.value}
                className={settings.speed === option.value ? "sound-choice active" : "sound-choice"}
                onClick={withClickSound(() => onUpdate({ ...settings, speed: option.value }))}
                onPointerDown={primeOnPressStart}
              >
                <span className="sound-choice-main">{option.label}</span>
              </button>
            ))}
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
