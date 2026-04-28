import type { SoundSettings } from '../types/game';

type SoundScreenProps = {
  settings: SoundSettings;
  onUpdate: (next: SoundSettings) => void;
  onBack: () => void;
};

export function SoundScreen({ settings, onUpdate, onBack }: SoundScreenProps) {
  return (
    <section className="screen">
      <h2>おと</h2>
      <div className="option-group">
        <p>よみあげ</p>
        <div className="option-row">
          <button className={settings.enabled ? 'option active' : 'option'} onClick={() => onUpdate({ ...settings, enabled: true })}>オン</button>
          <button className={!settings.enabled ? 'option active' : 'option'} onClick={() => onUpdate({ ...settings, enabled: false })}>オフ</button>
        </div>
      </div>

      <div className="option-group">
        <p>はやさ</p>
        <div className="option-row">
          <button className={settings.speed === 'normal' ? 'option active' : 'option'} onClick={() => onUpdate({ ...settings, speed: 'normal' })}>ふつう</button>
          <button className={settings.speed === 'slow' ? 'option active' : 'option'} onClick={() => onUpdate({ ...settings, speed: 'slow' })}>ゆっくり</button>
        </div>
      </div>

      <div className="option-group">
        <p>こえのたかさ</p>
        <div className="option-row">
          <button className={settings.pitch === 'normal' ? 'option active' : 'option'} onClick={() => onUpdate({ ...settings, pitch: 'normal' })}>ふつう</button>
          <button className={settings.pitch === 'high' ? 'option active' : 'option'} onClick={() => onUpdate({ ...settings, pitch: 'high' })}>たかめ</button>
        </div>
      </div>

      <button className="primary" onClick={onBack}>もどる</button>
    </section>
  );
}
