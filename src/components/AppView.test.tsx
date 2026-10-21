import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { createGameSession, DEFAULT_SPEECH_SETTINGS, type NewsApplication } from "../application";
import { AppView } from "./AppView";

vi.mock("./useButtonSound", () => ({
  useButtonSound: () => ({
    playOnPressStart: vi.fn(),
    withClickSound: <T extends unknown[]>(handler: (...args: T) => void) => handler,
  }),
}));

const session = createGameSession({ random: () => 0 });
const initial = session.getSnapshot();
session.start();
const first = session.getSnapshot();
session.select(first.choices[0]?.id ?? "");
const second = session.getSnapshot();
while (session.getSnapshot().screen.name === "select") {
  session.select(session.getSnapshot().choices[0]?.id ?? "");
}
const result = session.getSnapshot();

const state: NewsApplication["state"] = {
  mode: "game",
  game: initial,
  isOffline: false,
  lines: [],
  speech: { error: "", isSupported: true, isSpeaking: false, phase: "idle", availability: "ready" },
};

function view(overrides: Partial<NewsApplication["state"]> = {}) {
  return (
    <AppView
      application={{
        state: { ...state, ...overrides },
        commands: { start: vi.fn(), select: vi.fn(), replay: vi.fn() },
      }}
      settings={{ settings: DEFAULT_SPEECH_SETTINGS, saveSettings: vi.fn() }}
      audioCheck={null}
    />
  );
}

describe("game screen focus", () => {
  it("preserves focus on initial render and focuses each new question and result", () => {
    render(<button type="button">ほかのボタン</button>);
    const existingButton = screen.getByRole("button", { name: "ほかのボタン" });
    existingButton.focus();
    const { rerender } = render(view());
    expect(existingButton).toHaveFocus();

    rerender(view({ game: first }));
    expect(screen.getByRole("heading", { name: "だれが？" })).toHaveFocus();

    rerender(view({ game: second }));
    expect(screen.getByRole("heading", { name: "いつ？" })).toHaveFocus();

    rerender(view({ game: result, lines: result.lines }));
    expect(
      screen.getByRole("article", { name: "かんせいニュース" }).querySelector("h2"),
    ).toHaveFocus();

    const settings = screen.getByRole("button", { name: "おとな：音声設定" });
    expect(settings).toHaveTextContent("おとな");
    settings.focus();
    rerender(view({ game: result, speech: { ...state.speech, isSpeaking: true } }));
    expect(settings).toHaveFocus();

    rerender(view({ game: first }));
    expect(screen.getByRole("heading", { name: "だれが？" })).toHaveFocus();
  });

  it("does not take focus from an open settings dialog during a delayed selection", () => {
    const { rerender } = render(view());
    const dialog = screen.getByRole("dialog", { hidden: true });
    dialog.setAttribute("open", "");
    const closeButton = screen.getByRole("button", { name: "音声設定を閉じる" });
    closeButton.focus();

    rerender(view({ game: first }));

    expect(closeButton).toHaveFocus();
  });
});
