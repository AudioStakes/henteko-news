import { useState } from "react";
import { SpeechSettingsDialog } from "./SpeechSettingsDialog";

export function AppHeader() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <header className="app-header">
      <img src="/assets/header-logo.webp" alt="へんてこニュース" className="app-header__logo" />
      <button
        type="button"
        className="app-header__speech-settings"
        onClick={() => {
          setIsSettingsOpen(true);
        }}
      >
        音声設定
      </button>
      <SpeechSettingsDialog
        isOpen={isSettingsOpen}
        onClose={() => {
          setIsSettingsOpen(false);
        }}
      />
    </header>
  );
}
