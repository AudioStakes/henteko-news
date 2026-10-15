import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { SpeechSettingsProvider } from "../context/SpeechSettingsContext";
import { AppView } from "./AppView";

vi.mock("../hooks/useButtonSound", () => ({
  useButtonSound: () => ({
    playOnPressStart: vi.fn(),
    withClickSound: <T extends unknown[]>(handler: (...args: T) => void) => handler,
  }),
}));

const initialProps: ComponentProps<typeof AppView> = {
  isOffline: false,
  isWordsAudioCheckRoute: false,
  debugSelections: null,
  screen: { name: "start" },
  currentStep: 0,
  currentCategory: null,
  totalSteps: 5,
  lines: ["ねこが", "きょう", "うみで", "パンを", "たべました"],
  speechError: "",
  speechStatusText: "",
  isSupported: true,
  isSpeaking: false,
  imageUrl: "/test.png",
  onStart: vi.fn(),
  onSelectWord: vi.fn(),
  onReplayVoice: vi.fn(),
  onRestartGame: vi.fn(),
};

function view(props: ComponentProps<typeof AppView>) {
  return (
    <SpeechSettingsProvider>
      <AppView {...props} />
    </SpeechSettingsProvider>
  );
}

describe("game screen focus", () => {
  it("preserves focus on initial render and focuses each new question and result", () => {
    render(<button type="button">ほかのボタン</button>);
    const existingButton = screen.getByRole("button", { name: "ほかのボタン" });
    existingButton.focus();
    const { rerender } = render(view(initialProps));
    expect(existingButton).toHaveFocus();

    rerender(
      view({
        ...initialProps,
        screen: { name: "select", step: 0 },
        currentCategory: { key: "who", label: "だれが？", words: ["ねこ"] },
      }),
    );
    expect(screen.getByRole("heading", { name: "だれが？" })).toHaveFocus();

    rerender(
      view({
        ...initialProps,
        screen: { name: "select", step: 1 },
        currentStep: 1,
        currentCategory: { key: "when", label: "いつ？", words: ["きょう"] },
      }),
    );
    expect(screen.getByRole("heading", { name: "いつ？" })).toHaveFocus();

    rerender(view({ ...initialProps, screen: { name: "result" } }));
    expect(screen.getByRole("heading", { name: "かんせいニュース" })).toHaveFocus();

    const settings = screen.getByRole("button", { name: "音声設定" });
    settings.focus();
    rerender(view({ ...initialProps, screen: { name: "result" }, isSpeaking: true }));
    expect(settings).toHaveFocus();

    rerender(
      view({
        ...initialProps,
        screen: { name: "select", step: 0 },
        currentCategory: { key: "who", label: "だれが？", words: ["ねこ"] },
      }),
    );
    expect(screen.getByRole("heading", { name: "だれが？" })).toHaveFocus();
  });

  it("does not take focus from an open settings dialog during a delayed selection", () => {
    const { rerender } = render(view(initialProps));
    const dialog = screen.getByRole("dialog", { hidden: true });
    dialog.setAttribute("open", "");
    const closeButton = screen.getByRole("button", { name: "音声設定を閉じる" });
    closeButton.focus();

    rerender(
      view({
        ...initialProps,
        screen: { name: "select", step: 0 },
        currentCategory: { key: "who", label: "だれが？", words: ["ねこ"] },
      }),
    );

    expect(closeButton).toHaveFocus();
  });
});
