import { useLayoutEffect, useRef, useState } from 'react';
import { CharacterImage } from './CharacterImage';

type ResultScreenProps = {
  lines: string[];
  reaction: string;
  onReplayVoice: () => void;
  onRestartGame: () => void;
};

function getInitialFontSize(lines: string[]) {
  const longest = lines.reduce((max, line) => Math.max(max, line.length), 0);
  const lineCount = Math.max(lines.length, 1);
  const widthLimited = 48 - Math.max(0, longest - 6) * 2.8;
  const heightLimited = 48 - Math.max(0, lineCount - 3) * 4.5;
  return Math.max(20, Math.min(48, Math.min(widthLimited, heightLimited)));
}

export function ResultScreen({ lines, reaction, onReplayVoice, onRestartGame }: ResultScreenProps) {
  const bubbleRef = useRef<HTMLElement | null>(null);
  const [fontSize, setFontSize] = useState(() => getInitialFontSize(lines));

  useLayoutEffect(() => {
    const bubble = bubbleRef.current;
    if (!bubble) return;

    const fitText = () => {
      const nextSize = getInitialFontSize(lines);
      bubble.style.setProperty('--result-font-size', `${nextSize}px`);

      const textNodes = Array.from(bubble.querySelectorAll<HTMLElement>('.result-text'));
      let fittedSize = nextSize;

      while (
        fittedSize > 18 &&
        textNodes.some((node) => Math.ceil(node.scrollWidth) > Math.ceil(node.clientWidth))
      ) {
        fittedSize -= 1;
        bubble.style.setProperty('--result-font-size', `${fittedSize}px`);
      }

      setFontSize(fittedSize);
    };

    fitText();

    const resizeObserver = new ResizeObserver(() => fitText());
    resizeObserver.observe(bubble);
    return () => resizeObserver.disconnect();
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
      <div className="action-stack compact">
        <button className="action-btn orange small" onClick={onReplayVoice}><span>もういっかいきく！</span></button>
        <button className="action-btn blue small" onClick={onRestartGame}><span>もういっかいつくる！</span></button>
      </div>
    </section>
  );
}
