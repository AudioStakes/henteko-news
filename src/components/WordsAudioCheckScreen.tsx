import { useMemo, useRef, useState } from "react";
import { CATEGORIES } from "../data/words";
import { useSpeech } from "../hooks/useSpeech";
import { toWordOption } from "../utils/wordOption";

type QueueItem = {
  categoryKey: string;
  categoryLabel: string;
  displayText: string;
  speechText: string;
};
const CATEGORY_BUTTON_LABELS: Record<string, string> = {
  who: "だれが",
  when: "いつ",
  where: "どこで",
  what: "なにを",
  action: "どうした",
};

function buildQueue(): QueueItem[] {
  return CATEGORIES.flatMap((category) =>
    category.words.map((word) => {
      const option = toWordOption(word);
      return {
        categoryKey: category.key,
        categoryLabel: category.label,
        displayText: option.display,
        speechText: option.speech ?? option.display,
      };
    }),
  );
}

export function WordsAudioCheckScreen() {
  const queue = useMemo(() => buildQueue(), []);
  const categoryStarts = useMemo(
    () =>
      CATEGORIES.map((category) => ({
        key: category.key,
        label: CATEGORY_BUTTON_LABELS[category.key] ?? category.label.replace("？", ""),
        startIndex: queue.findIndex((item) => item.categoryKey === category.key),
      })),
    [queue],
  );
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState("");
  const resumeIndexRef = useRef(0);
  const { speak, cancel, isSupported } = useSpeech();

  const stopPlayback = () => {
    resumeIndexRef.current = Math.max(currentIndex, 0);
    setCurrentIndex(-1);
    setIsPlaying(false);
    cancel();
  };
  const playFrom = (startIndex: number) => {
    if (!isSupported) return setError("このブラウザでは よみあげが つかえません。");
    stopPlayback();
    setError("");
    setIsPlaying(true);
    let idx = startIndex;
    const next = () => {
      if (idx >= queue.length) {
        setIsPlaying(false);
        setCurrentIndex(queue.length - 1);
        resumeIndexRef.current = 0;
        return;
      }
      setCurrentIndex(idx);
      resumeIndexRef.current = idx;
      const ok = speak(queue[idx].speechText, {
        rate: 0.9,
        pitch: 1,
        onEnd: () => {
          idx += 1;
          next();
        },
        onError: () => {
          setIsPlaying(false);
          setError("よみあげが とちゅうで とまりました。もういちど はじめてください。");
        },
      });
      if (!ok) {
        setIsPlaying(false);
        setError("よみあげが とちゅうで とまりました。もういちど はじめてください。");
      }
    };
    next();
  };

  const currentItem = currentIndex >= 0 ? queue[currentIndex] : null;
  return (
    <section className="screen sound-screen">
      <div className="sound-card words-audio-check">
        <h1>おんせい かくにん</h1>
        <div className="words-audio-check__status">
          <p>
            しんこう:{" "}
            {currentIndex >= 0 ? `${currentIndex + 1} / ${queue.length}` : `0 / ${queue.length}`}
          </p>
          <p>カテゴリ: {currentItem?.categoryLabel ?? "まだ さいせいしていません"}</p>
          <p>いまのことば: {currentItem?.displayText ?? "「かいし」を おしてください"}</p>
        </div>
        {error && <p className="speech-error words-audio-check__error">{error}</p>}
        <div className="action-stack">
          <button
            type="button"
            className="action-btn orange small"
            onClick={() => playFrom(0)}
            disabled={isPlaying}
          >
            さいしょから かいし
          </button>
          <button
            type="button"
            className="action-btn orange small"
            onClick={() => playFrom(resumeIndexRef.current)}
            disabled={isPlaying || queue.length === 0}
          >
            とまったところから さいかい
          </button>
          <button
            type="button"
            className="action-btn blue small"
            onClick={stopPlayback}
            disabled={!isPlaying}
          >
            ていし
          </button>
        </div>
        <div className="words-audio-check__category-buttons">
          {categoryStarts.map((category) => (
            <button
              key={category.key}
              type="button"
              className="sound-choice"
              onClick={() => playFrom(category.startIndex)}
              disabled={isPlaying || category.startIndex < 0}
            >
              {category.label} から
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
