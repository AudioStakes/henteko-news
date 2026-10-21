export { SpeechSettingsProvider, useSpeechSettings } from "../context/SpeechSettingsContext";
export type { SpeechPhase } from "../hooks/useSpeech";
export { playChoiceSoundFromUserGesture } from "../utils/soundEffects";
export type { Choice } from "./gameChoices";
export {
  createGameSession,
  type GameSession,
  type GameSnapshot,
  type ScreenState,
} from "./gameSession";
export {
  DEFAULT_SPEECH_SETTINGS,
  type SaveSettingsResult,
  type SpeechProvider,
  type SpeechSettings,
  type SpeechSettingsApi,
  type SpeechSettingsErrors,
} from "./speechSettings";
export {
  type ApplicationMode,
  type NewsApplication,
  useNewsApplication,
} from "./useNewsApplication";
export { useWordsAudioCheck, type WordsAudioCheckApi } from "./useWordsAudioCheck";
