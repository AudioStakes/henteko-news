import { useLayoutEffect, useRef, useState } from 'react';
import { CharacterImage } from './CharacterImage';
import { playChoiceSound, primeChoiceSound } from '../utils/soundEffects';

type ResultScreenProps = {
  lines: string[];
  reaction: string;
  onReplayVoice: () => void;
  onOpenSound: () => void;
  onRestartGame: () => void;
};

const MIN_FONT_SIZE = 20;
const MAX_FONT_SIZE = 48;

function getInitialFontSize(lines: string[]) {
  const longest = lines.reduce((max, line) => Math.max(max, line.length), 0);
  const lineCount = Math.max(lines.length, 1);
  const widthLimited = MAX_FONT_SIZE - Math.max(0, longest - 6) * 2.8;
  const heightLimited = MAX_FONT_SIZE - Math.max(0, lineCount - 3) * 4.5;
  return Math.max(MIN_FONT_SIZE, Math.min(MAX_FONT_SIZE, Math.min(widthLimited, heightLimited)));
}

export function ResultScreen({ lines, reaction, onReplayVoice, onOpenSound, onRestartGame }: ResultScreenProps) {
  const bubbleRef = useRef<HTMLElement | null>(null);
  const [fontSize, setFontSize] = useState(() => getInitialFontSize(lines));

  const handlePressStart = () => {
    void primeChoiceSound().catch(() => {
      // iOS Safari may reject unlock attempts; try again on actual tap.
    });
  };

  const withClickSound = (callback: () => void) => () => {
    void playChoiceSound().catch(() => {
      // Keep the button action available even when sound playback fails.
    });
    callback();
  };

  useLayoutEffect(() => {
    const bubble = bubbleRef.current;
    if (!bubble) return;

    const fitText = () => {
      const nextSize = getInitialFontSize(lines);
      bubble.style.setProperty('--result-font-size', `${nextSize}px`);

      const textNodes = Array.from(bubble.querySelectorAll<HTMLElement>('.result-text'));
      let fittedSize = nextSize;

      while (
        fittedSize > MIN_FONT_SIZE &&
        textNodes.some((node) => Math.ceil(node.scrollWidth) > Math.ceil(node.clientWidth))
      ) {
        fittedSize -= 1;
        bubble.style.setProperty('--result-font-size', `${fittedSize}px`);
      }

      setFontSize(fittedSize);
    };

    fitText();

    if (typeof ResizeObserver !== 'undefined') {
      const resizeObserver = new ResizeObserver(() => fitText());
      resizeObserver.observe(bubble);
      return () => resizeObserver.disconnect();
    }

    window.addEventListener('resize', fitText);
    return () => window.removeEventListener('resize', fitText);
  }, [lines]);

  return (
    <section className="screen result-screen">
      <article
        ref={bubbleRef}
        className="result-bubble"
        aria-label="かんせいニュース"
        style={{
          ['--result-line-count' as string]: String(Math.max(lines.length, 1)),
          ['--result-font-size' as string]: `${fontSize}px`,
        }}
      >
        {lines.map((line) => <p className="result-text" key={line}>{line}</p>)}
      </article>

      <div className="result-bottom">
        <CharacterImage variant="result" className="result-character" />
        <p className="reaction">{reaction}</p>
      </div>

      <div className="action-stack compact result-actions">
        <button
          className="action-btn result-action replay"
          onClick={withClickSound(onReplayVoice)}
          onPointerDown={handlePressStart}
          onTouchStart={handlePressStart}
        >
          <span className="action-icon" aria-hidden="true">↻</span>
          <span>もう1かいきく</span>
        </button>

        <button
          className="action-btn result-action sound"
          onClick={withClickSound(onOpenSound)}
          onPointerDown={handlePressStart}
          onTouchStart={handlePressStart}
        >
          <span className="action-icon" aria-hidden="true">🔊</span>
          <span>こえ</span>
        </button>

        <button
          className="action-btn result-action next"
          onClick={withClickSound(onRestartGame)}
          onPointerDown={handlePressStart}
          onTouchStart={handlePressStart}
        >
          <span>ニュースをつくる</span>
        </button>
      </div>
    </section>
  );
}
