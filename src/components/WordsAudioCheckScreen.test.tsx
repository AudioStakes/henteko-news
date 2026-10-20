import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { WordsAudioCheckApi } from "../application";
import { WordsAudioCheckScreen } from "./WordsAudioCheckScreen";

function createProps(): WordsAudioCheckApi {
  return {
    state: {
      queue: [
        {
          categoryKey: "who",
          categoryLabel: "だれが？",
          displayText: "ひよこが",
          speechText: "ひよこが",
        },
      ],
      currentItem: null,
      currentIndex: -1,
      isPlaying: false,
      error: "",
      categoryStarts: [{ key: "who", label: "だれが", startIndex: 0 }],
    },
    commands: {
      start: vi.fn<() => boolean>().mockReturnValue(true),
      resume: vi.fn<() => boolean>().mockReturnValue(true),
      stop: vi.fn<() => void>(),
      startCategory: vi.fn<WordsAudioCheckApi["commands"]["startCategory"]>().mockReturnValue(true),
    },
  };
}

describe("WordsAudioCheckScreen", () => {
  it("renders supplied state and sends button actions to the API", () => {
    const props = createProps();
    render(<WordsAudioCheckScreen {...props} />);

    expect(screen.getByText("しんこう: 0 / 1")).toBeInTheDocument();
    expect(screen.getByText("カテゴリ: まだ さいせいしていません")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ていし" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "さいしょから かいし" }));
    fireEvent.click(screen.getByRole("button", { name: "とまったところから さいかい" }));
    fireEvent.click(screen.getByRole("button", { name: "だれが から" }));

    expect(props.commands.start).toHaveBeenCalledExactlyOnceWith();
    expect(props.commands.resume).toHaveBeenCalledExactlyOnceWith();
    expect(props.commands.startCategory).toHaveBeenCalledExactlyOnceWith("who");
  });

  it("shows the current word and enables only stop while playing", () => {
    const props = createProps();
    props.state.currentIndex = 0;
    props.state.currentItem = props.state.queue[0] ?? null;
    props.state.isPlaying = true;
    render(<WordsAudioCheckScreen {...props} />);

    expect(screen.getByText("しんこう: 1 / 1")).toBeInTheDocument();
    expect(screen.getByText("カテゴリ: だれが？")).toBeInTheDocument();
    expect(screen.getByText("いまのことば: ひよこが")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "さいしょから かいし" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "とまったところから さいかい" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "だれが から" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "ていし" }));

    expect(props.commands.stop).toHaveBeenCalledExactlyOnceWith();
  });

  it("displays API errors and disables unavailable queue actions", () => {
    const props = createProps();
    props.state.queue = [];
    props.state.categoryStarts = [{ key: "who", label: "だれが", startIndex: -1 }];
    props.state.error = "よみあげが とまりました。";
    render(<WordsAudioCheckScreen {...props} />);

    expect(screen.getByText(props.state.error)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "とまったところから さいかい" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "だれが から" })).toBeDisabled();
  });
});
