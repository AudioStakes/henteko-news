import type { WordsAudioCheckApi } from "../application";

export function WordsAudioCheckScreen({ state, commands }: WordsAudioCheckApi) {
  const { queue, currentItem, currentIndex, isPlaying, error, categoryStarts } = state;
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
        {error.length > 0 && <p className="speech-error words-audio-check__error">{error}</p>}
        <div className="action-stack">
          <button
            type="button"
            className="action-btn orange small"
            onClick={() => {
              commands.start();
            }}
            disabled={isPlaying}
          >
            さいしょから かいし
          </button>
          <button
            type="button"
            className="action-btn orange small"
            onClick={() => {
              commands.resume();
            }}
            disabled={isPlaying || queue.length === 0}
          >
            とまったところから さいかい
          </button>
          <button
            type="button"
            className="action-btn blue small"
            onClick={() => {
              commands.stop();
            }}
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
