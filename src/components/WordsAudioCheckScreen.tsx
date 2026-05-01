import { useMemo, useRef } from "react";
import { CATEGORIES } from "../data/words";
import { useSpeechQueue } from "../hooks/useSpeechQueue";
import { toWordOption } from "../utils/wordOption";

const CATEGORY_BUTTON_LABELS: Record<string, string> = {
  who: "だれが",
  when: "いつ",
  where: "どこで",
  what: "なにを",
  action: "どうした",
};
function buildQueue() {
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
  const resumeIndexRef = useRef(0);
  const { start, stop, currentIndex, isPlaying, error } = useSpeechQueue(
    queue.map((i) => i.speechText),
    {
      onComplete: () => {
        resumeIndexRef.current = 0;
      },
      onError: () => {},
    },
  );
  const categoryStarts = useMemo(
    () =>
      CATEGORIES.map((category) => ({
        key: category.key,
        label: CATEGORY_BUTTON_LABELS[category.key] ?? category.label.replace("？", ""),
        startIndex: queue.findIndex((item) => item.categoryKey === category.key),
      })),
    [queue],
  );
  const playFrom = (idx: number) => {
    resumeIndexRef.current = idx;
    start(idx);
  };
  const stopPlayback = () => {
    resumeIndexRef.current = Math.max(currentIndex, 0);
    stop();
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
