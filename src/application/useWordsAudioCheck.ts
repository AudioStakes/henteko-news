import { useLayoutEffect, useMemo, useRef } from "react";
import { CATEGORIES } from "../data/words";
import { useSpeechQueue } from "../hooks/useSpeechQueue";
import type { CategoryKey } from "../types/game";
import { toWordOption } from "../utils/wordOption";

const CATEGORY_BUTTON_LABELS: Record<CategoryKey, string> = {
  who: "だれが",
  when: "いつ",
  where: "どこで",
  what: "なにを",
  action: "どうした",
};

const QUEUE = Object.freeze(
  CATEGORIES.flatMap((category) =>
    category.words.map((word) => {
      const option = toWordOption(word);
      return Object.freeze({
        categoryKey: category.key,
        categoryLabel: category.label,
        displayText: option.display,
        speechText: option.speech ?? option.display,
      });
    }),
  ),
);

const SPEECH_ITEMS = QUEUE.map((item) => item.speechText);
const CATEGORY_STARTS = Object.freeze(
  CATEGORIES.map((category) =>
    Object.freeze({
      key: category.key,
      label: CATEGORY_BUTTON_LABELS[category.key],
      startIndex: QUEUE.findIndex((item) => item.categoryKey === category.key),
    }),
  ),
);

export function useWordsAudioCheck() {
  const queue = useSpeechQueue(SPEECH_ITEMS);
  const { currentIndex, isPlaying, error } = queue;
  const runtime = useRef({ queue, active: true });

  useLayoutEffect(() => {
    runtime.current = { queue, active: true };
  });
  useLayoutEffect(
    () => () => {
      runtime.current.active = false;
    },
    [],
  );

  const commands = useMemo(
    () => ({
      start(this: void) {
        const { active, queue } = runtime.current;
        return active && queue.start(0);
      },
      resume(this: void) {
        const { active, queue } = runtime.current;
        return active && queue.resume();
      },
      stop(this: void) {
        const { active, queue } = runtime.current;
        if (active) {
          queue.stop();
        }
      },
      startCategory(this: void, key: CategoryKey) {
        const { active, queue } = runtime.current;
        if (!active) {
          return false;
        }
        const category = CATEGORY_STARTS.find((candidate) => candidate.key === key);
        return (
          category !== undefined && category.startIndex >= 0 && queue.start(category.startIndex)
        );
      },
    }),
    [],
  );

  return {
    state: {
      queue: QUEUE,
      currentItem: QUEUE[currentIndex] ?? null,
      currentIndex,
      isPlaying,
      error,
      categoryStarts: CATEGORY_STARTS,
    },
    commands,
  };
}

export type WordsAudioCheckApi = ReturnType<typeof useWordsAudioCheck>;
