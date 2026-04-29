import type { SoundSettings } from '../types/game';

type SoundScreenProps = {
  settings: SoundSettings;
  onUpdate: (next: SoundSettings) => void;
  onBack: () => void;
};

export function SoundScreen({ settings, onUpdate, onBack }: SoundScreenProps) {
  return (
    <section className="screen sound-screen">
      <div className="sound-card">
        <h1>こえ</h1>

        <div className="sound-list" aria-label="よみあげ">
          <p className="sound-label">よみあげ</p>
          <div className="sound-row two">
            <button aria-pressed={settings.enabled} className={settings.enabled ? 'choice-card yellow active' : 'choice-card yellow'} onClick={() => onUpdate({ ...settings, enabled: true })}>オン</button>
            <button aria-pressed={!settings.enabled} className={!settings.enabled ? 'choice-card green active' : 'choice-card green'} onClick={() => onUpdate({ ...settings, enabled: false })}>オフ</button>
          </div>
        </div>

        <div className="sound-list" aria-label="はやさ">
          <p className="sound-label">はやさ</p>
          <div className="sound-row three">
            <button aria-pressed={settings.speed === 'slow'} className={settings.speed === 'slow' ? 'choice-card yellow active' : 'choice-card yellow'} onClick={() => onUpdate({ ...settings, speed: 'slow' })}>ゆっくり</button>
            <button aria-pressed={settings.speed === 'normal'} className={settings.speed === 'normal' ? 'choice-card green active' : 'choice-card green'} onClick={() => onUpdate({ ...settings, speed: 'normal' })}>ふつう</button>
            <button aria-pressed={settings.speed === 'fast'} className={settings.speed === 'fast' ? 'choice-card blue-line active' : 'choice-card blue-line'} onClick={() => onUpdate({ ...settings, speed: 'fast' })}>はやい</button>
          </div>
        </div>

        <div className="sound-list" aria-label="こえのたかさ">
          <p className="sound-label">こえのたかさ</p>
          <div className="sound-row three">
            <button aria-pressed={settings.pitch === 'low'} className={settings.pitch === 'low' ? 'choice-card purple active' : 'choice-card purple'} onClick={() => onUpdate({ ...settings, pitch: 'low' })}>ひくい</button>
            <button aria-pressed={settings.pitch === 'normal'} className={settings.pitch === 'normal' ? 'choice-card orange-line active' : 'choice-card orange-line'} onClick={() => onUpdate({ ...settings, pitch: 'normal' })}>ふつう</button>
            <button aria-pressed={settings.pitch === 'high'} className={settings.pitch === 'high' ? 'choice-card teal active' : 'choice-card teal'} onClick={() => onUpdate({ ...settings, pitch: 'high' })}>たかめ</button>
          </div>
        </div>

        <button className="action-btn orange small" onClick={onBack}><span>けってい</span></button>
      </div>
    </section>
  );
}
