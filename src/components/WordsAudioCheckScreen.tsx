import type { WordsAudioCheckApi } from "../application";
import "./WordsAudioCheckScreen.css";

export function WordsAudioCheckScreen({ state, commands }: WordsAudioCheckApi) {
  const { queue, currentItem, currentIndex, isPlaying, error, categoryStarts } = state;
  return (
    <section className="words-audio-check">
      <h1 className="words-audio-check__title" data-screen-heading tabIndex={-1}>
        おんせい かくにん
      </h1>
      <p className="words-audio-check__help">
        開発者向け · 全{queue.length}語
        <br />
        登録された言葉を順番に読み上げます。
      </p>
      <div className="words-audio-check__content">
        <div className="words-audio-check__status">
          <p className="words-audio-check__progress">
            しんこう:{" "}
            {currentIndex >= 0 ? `${currentIndex + 1} / ${queue.length}` : `0 / ${queue.length}`}
          </p>
          <p>カテゴリ: {currentItem?.categoryLabel ?? "まだ さいせいしていません"}</p>
          <p className="words-audio-check__current-word">
            いまのことば: {currentItem?.displayText ?? "「かいし」を おしてください"}
          </p>
        </div>
        {error.length > 0 && (
          <p className="words-audio-check__error" role="alert">
            {error}
          </p>
        )}
        <div className="words-audio-check__controls">
          <button
            type="button"
            onClick={() => {
              commands.start();
            }}
            disabled={isPlaying}
          >
            さいしょから かいし
          </button>
          <button
            type="button"
            onClick={() => {
              commands.resume();
            }}
            disabled={isPlaying || queue.length === 0}
          >
            とまったところから さいかい
          </button>
          <button
            type="button"
            className="words-audio-check__stop"
            onClick={() => {
              commands.stop();
            }}
            disabled={!isPlaying}
          >
            ていし
          </button>
          {categoryStarts.map((category) => (
            <button
              key={category.key}
              type="button"
              onClick={() => {
                commands.startCategory(category.key);
              }}
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
