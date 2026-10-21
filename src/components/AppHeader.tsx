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
      <h1 className="sr-only">へんてこニュース</h1>
      <div className="utility-bar">
        <button
          type="button"
          className="app-header__speech-settings"
          aria-label="おとな：音声設定"
          ref={settingsButtonRef}
          onClick={() => {
            setIsSettingsOpen(true);
          }}
        >
          おとな
        </button>
      </div>
      <div className="brand">
        <img
          src="/assets/header-logo.webp"
          alt="へんてこニュース"
          className="app-header__logo"
          width={600}
          height={200}
        />
      </div>
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
