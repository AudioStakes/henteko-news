import { useState } from "react";
import { REACTIONS } from "../data/words";
import type { Selections, SoundSettings } from "../types/game";
import { buildNewsLines, toSpeechText } from "../utils/speechText";
import { useSpeech } from "./useSpeech";

function pickReaction() {
  return REACTIONS[Math.floor(Math.random() * REACTIONS.length)];
}

function getVoiceConfig(sound: SoundSettings) {
  const rate =
    sound.speed === "slow"
      ? 0.75
      : sound.speed === "fast"
        ? 1.1
        : sound.speed === "veryFast"
          ? 1.3
          : 0.9;
  const pitch =
    sound.speed === "slow"
      ? 1.0
      : sound.speed === "fast"
        ? 1.4
        : sound.speed === "veryFast"
          ? 1.6
          : 1.15;
  return { rate, pitch };
}

export function useNewsSpeech(soundSettings: SoundSettings) {
  const [reaction, setReaction] = useState("");
  const [speechError, setSpeechError] = useState("");
  const { speak, isSupported, isSpeaking, warmup, cancel } = useSpeech();
  const showSpeechUnavailable = () =>
    setSpeechError("よみあげの おとが でません。ブラウザを さいきどうすると なおるかも。");

  const speakNews = (nextSelections: Selections) => {
    if (!soundSettings.enabled || buildNewsLines(nextSelections).length !== 5) return;
    setSpeechError("");
    const { rate, pitch } = getVoiceConfig(soundSettings);
    const ok = speak(toSpeechText(nextSelections), {
      rate,
      pitch,
      onEnd: () => setReaction(pickReaction()),
      onError: showSpeechUnavailable,
    });
    if (!ok && !isSpeaking) showSpeechUnavailable();
  };

  return {
    reaction,
    speechError,
    setSpeechError,
    setReaction,
    isSupported,
    warmup,
    cancel,
    speakNews,
    isSpeaking,
  };
}
