import { useEffect, useMemo, useRef, useState } from 'react';
import { CATEGORIES } from '../data/words';
import { toPoliteAction } from '../utils/speechText';

type QueueItem = {
  categoryKey: string;
  categoryLabel: string;
  displayText: string;
  speechText: string;
};

const DEFAULT_LANG = 'ja-JP';

function buildQueue(): QueueItem[] {
  return CATEGORIES.flatMap((category) =>
    category.words.map((word) => ({
      categoryKey: category.key,
      categoryLabel: category.label,
      displayText: word,
      speechText: category.key === 'action' ? toPoliteAction(word) : word,
    })),
  );
}

const CATEGORY_BUTTON_LABELS: Record<string, string> = {
  who: 'だれが',
  when: 'いつ',
  where: 'どこで',
  what: 'なにを',
  action: 'どうした',
};

export function WordsAudioCheckScreen() {
  const queue = useMemo(() => buildQueue(), []);
  const categoryStarts = useMemo(
    () =>
      CATEGORIES.map((category) => ({
        key: category.key,
        label: CATEGORY_BUTTON_LABELS[category.key] ?? category.label.replace('？', ''),
        startIndex: queue.findIndex((item) => item.categoryKey === category.key),
      })),
    [queue],
  );
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState('');
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const indexRef = useRef(-1);
  const resumeIndexRef = useRef(0);

  useEffect(() => {
    indexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const stopPlayback = () => {
    const currentResumeIndex = indexRef.current >= 0 ? indexRef.current : 0;
    resumeIndexRef.current = currentResumeIndex;
    utteranceRef.current = null;
    setIsPlaying(false);
    window.speechSynthesis.cancel();
  };

  const playFrom = (startIndex: number) => {
    if (!('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) {
      setError('このブラウザでは よみあげが つかえません。');
      return;
    }

    stopPlayback();
    setError('');
    resumeIndexRef.current = startIndex;
    setCurrentIndex(startIndex);
    setIsPlaying(true);

    const speakNext = (index: number) => {
      if (index >= queue.length) {
        utteranceRef.current = null;
        setCurrentIndex(queue.length - 1);
        setIsPlaying(false);
        resumeIndexRef.current = 0;
        return;
      }

      const item = queue[index];
      resumeIndexRef.current = index;
      setCurrentIndex(index);

      const utterance = new SpeechSynthesisUtterance(item.speechText);
      utteranceRef.current = utterance;
      utterance.lang = DEFAULT_LANG;
      utterance.rate = 0.9;
      utterance.pitch = 1;

      utterance.onend = () => {
        if (indexRef.current !== index) return;
        speakNext(index + 1);
      };

      utterance.onerror = () => {
        utteranceRef.current = null;
        setIsPlaying(false);
        setError('よみあげが とちゅうで とまりました。もういちど はじめてください。');
      };

      window.speechSynthesis.resume();
      window.speechSynthesis.speak(utterance);
    };

    speakNext(startIndex);
  };

  const currentItem = currentIndex >= 0 ? queue[currentIndex] : null;

  return (
    <section className="screen sound-screen">
      <div className="sound-card words-audio-check">
        <h1>おんせい かくにん</h1>
        <div className="words-audio-check__status">
          <p>しんこう: {currentIndex >= 0 ? `${currentIndex + 1} / ${queue.length}` : `0 / ${queue.length}`}</p>
          <p>カテゴリ: {currentItem?.categoryLabel ?? 'まだ さいせいしていません'}</p>
          <p>いまのことば: {currentItem?.displayText ?? '「かいし」を おしてください'}</p>
        </div>
        {error && <p className="speech-error words-audio-check__error">{error}</p>}
        <div className="action-stack">
          <button type="button" className="action-btn orange small" onClick={() => playFrom(0)} disabled={isPlaying}>
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
          <button type="button" className="action-btn blue small" onClick={stopPlayback} disabled={!isPlaying}>
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
