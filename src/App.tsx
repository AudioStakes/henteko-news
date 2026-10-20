import {
  SpeechSettingsProvider,
  useNewsApplication,
  useSpeechSettings,
  useWordsAudioCheck,
} from "./application";
import { AppView } from "./components/AppView";
import { WordsAudioCheckScreen } from "./components/WordsAudioCheckScreen";

export default function App() {
  return (
    <SpeechSettingsProvider>
      <AppContent />
    </SpeechSettingsProvider>
  );
}

function AppContent() {
  const application = useNewsApplication();
  const settings = useSpeechSettings();
  return (
    <AppView
      application={application}
      settings={settings}
      audioCheck={application.state.mode === "audio-check" ? <AudioCheck /> : null}
    />
  );
}

function AudioCheck() {
  const audioCheck = useWordsAudioCheck();
  return <WordsAudioCheckScreen {...audioCheck} />;
}
