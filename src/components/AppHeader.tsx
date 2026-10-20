import { useRef, useState } from "react";
import type { SpeechSettings, SpeechSettingsApi } from "../application";
import { SpeechSettingsDialog } from "./SpeechSettingsDialog";

type AppHeaderProps = {
  settings: SpeechSettings;
  defaults: SpeechSettings;
  onSave: SpeechSettingsApi["saveSettings"];
};

export function AppHeader({ settings, defaults, onSave }: AppHeaderProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <header className="app-header">
      <h1 className="visually-hidden">へんてこニュース</h1>
      <img src="/assets/header-logo.webp" alt="へんてこニュース" className="app-header__logo" />
      <button
        type="button"
        className="app-header__speech-settings"
        ref={settingsButtonRef}
        onClick={() => {
          setIsSettingsOpen(true);
        }}
      >
        音声設定
      </button>
      <SpeechSettingsDialog
        settings={settings}
        defaults={defaults}
        onSave={onSave}
        isOpen={isSettingsOpen}
        returnFocusRef={settingsButtonRef}
        onClose={() => {
          setIsSettingsOpen(false);
        }}
      />
    </header>
  );
}
