import { fireEvent, render, screen } from "@testing-library/react";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { SpeechSettingsProvider, useSpeechSettings } from "../context/SpeechSettingsContext";
import { SPEECH_SETTINGS_STORAGE_KEY } from "../utils/speechSettings";
import { AppHeader } from "./AppHeader";

const showModalDescriptor = Object.getOwnPropertyDescriptor(
  HTMLDialogElement.prototype,
  "showModal",
);
const closeDescriptor = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, "close");

function ChoiceReader({ label }: { label: string }) {
  const { settings } = useSpeechSettings();
  return <output aria-label={label}>{JSON.stringify(settings)}</output>;
}

function renderSettings() {
  return render(
    <SpeechSettingsProvider>
      <AppHeader />
      <ChoiceReader label="game choice" />
      <ChoiceReader label="audio check choice" />
    </SpeechSettingsProvider>,
  );
}

function openSettings() {
  const button = screen.getByRole("button", { name: "音声設定" });
  button.focus();
  fireEvent.click(button);
  return screen.getByRole("dialog", { name: "音声設定" });
}

function chooseModel() {
  fireEvent.change(screen.getByLabelText("読み上げ方式"), { target: { value: "supertonic" } });
}

describe("speech settings dialog", () => {
  beforeAll(() => {
    Object.defineProperty(HTMLDialogElement.prototype, "showModal", {
      configurable: true,
      value(this: HTMLDialogElement) {
        this.setAttribute("open", "");
        this.querySelector<HTMLElement>("button")?.focus();
      },
    });
    Object.defineProperty(HTMLDialogElement.prototype, "close", {
      configurable: true,
      value(this: HTMLDialogElement) {
        this.removeAttribute("open");
        this.dispatchEvent(new Event("close"));
      },
    });
  });

  afterAll(() => {
    if (showModalDescriptor) {
      Object.defineProperty(HTMLDialogElement.prototype, "showModal", showModalDescriptor);
    } else {
      Reflect.deleteProperty(HTMLDialogElement.prototype, "showModal");
    }
    if (closeDescriptor) {
      Object.defineProperty(HTMLDialogElement.prototype, "close", closeDescriptor);
    } else {
      Reflect.deleteProperty(HTMLDialogElement.prototype, "close");
    }
  });

  beforeEach(() => {
    window.localStorage.clear();
  });

  it("saves model paths for all consumers and restores the saved draft on reopening", () => {
    renderSettings();
    openSettings();
    expect(screen.getByLabelText("読み上げ方式")).toHaveValue("web-speech");
    chooseModel();
    expect(screen.getByLabelText("モデルのフォルダー")).toHaveValue("/supertonic/onnx");
    expect(screen.getByLabelText("声のJSONファイル")).toHaveValue(
      "/supertonic/voice_styles/M1.json",
    );
    fireEvent.change(screen.getByLabelText("モデルのフォルダー"), {
      target: { value: "  https://models.example.com/onnx  " },
    });
    fireEvent.change(screen.getByLabelText("声のJSONファイル"), {
      target: { value: "voices/F1.json" },
    });
    expect(screen.getByLabelText("game choice")).toHaveTextContent('"provider":"web-speech"');

    fireEvent.click(screen.getByRole("button", { name: "設定を保存" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "音声設定" })).toHaveFocus();
    expect(screen.getByLabelText("game choice")).toHaveTextContent('"provider":"supertonic"');
    expect(screen.getByLabelText("audio check choice").textContent).toBe(
      screen.getByLabelText("game choice").textContent,
    );
    expect(JSON.parse(window.localStorage.getItem(SPEECH_SETTINGS_STORAGE_KEY) ?? "null")).toEqual({
      provider: "supertonic",
      modelBasePath: "https://models.example.com/onnx",
      voiceStylePath: "voices/F1.json",
    });

    openSettings();
    expect(screen.getByLabelText("読み上げ方式")).toHaveValue("supertonic");
    expect(screen.getByLabelText("モデルのフォルダー")).toHaveValue(
      "https://models.example.com/onnx",
    );
  });

  it.each(["cancel", "escape", "close"])("discards an unsaved draft on %s", (action) => {
    renderSettings();
    const dialog = openSettings();
    chooseModel();
    fireEvent.change(screen.getByLabelText("モデルのフォルダー"), {
      target: { value: "/unsaved/onnx" },
    });

    if (action === "escape") {
      fireEvent(dialog, new Event("cancel", { cancelable: true }));
    } else {
      fireEvent.click(
        screen.getByRole("button", {
          name: action === "cancel" ? "キャンセル" : "音声設定を閉じる",
        }),
      );
    }

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "音声設定" })).toHaveFocus();
    expect(screen.getByLabelText("game choice")).toHaveTextContent('"provider":"web-speech"');
    openSettings();
    expect(screen.getByLabelText("読み上げ方式")).toHaveValue("web-speech");
    chooseModel();
    expect(screen.getByLabelText("モデルのフォルダー")).toHaveValue("/supertonic/onnx");
  });

  it.each([
    { model: "javascript:alert(1)", voice: "", modelInvalid: true, voiceInvalid: true },
    {
      model: "/custom/onnx?",
      voice: "/voices/M1.json",
      modelInvalid: true,
      voiceInvalid: false,
    },
    {
      model: "/custom/onnx#",
      voice: "/voices/M1.json",
      modelInvalid: true,
      voiceInvalid: false,
    },
    {
      model: "/custom/onnx",
      voice: "/voices/M1.json#",
      modelInvalid: false,
      voiceInvalid: true,
    },
  ])(
    "rejects invalid paths ($model, $voice) and focuses the first invalid field",
    ({ model, voice, modelInvalid, voiceInvalid }) => {
      renderSettings();
      openSettings();
      chooseModel();
      const modelInput = screen.getByLabelText("モデルのフォルダー");
      const voiceInput = screen.getByLabelText("声のJSONファイル");
      fireEvent.change(modelInput, { target: { value: model } });
      fireEvent.change(voiceInput, { target: { value: voice } });

      fireEvent.click(screen.getByRole("button", { name: "設定を保存" }));

      expect(screen.getByRole("dialog", { name: "音声設定" })).toBeInTheDocument();
      expect(screen.getAllByRole("alert")).toHaveLength(
        Number(modelInvalid) + Number(voiceInvalid),
      );
      expect(modelInput).toHaveAttribute("aria-invalid", String(modelInvalid));
      expect(voiceInput).toHaveAttribute("aria-invalid", String(voiceInvalid));
      expect(modelInvalid ? modelInput : voiceInput).toHaveFocus();
      expect(screen.getByLabelText("game choice")).toHaveTextContent('"provider":"web-speech"');
    },
  );

  it("resets to browser defaults only after saving", () => {
    window.localStorage.setItem(
      SPEECH_SETTINGS_STORAGE_KEY,
      JSON.stringify({
        provider: "supertonic",
        modelBasePath: "/custom/onnx",
        voiceStylePath: "/custom/F1.json",
      }),
    );
    renderSettings();
    openSettings();

    fireEvent.click(screen.getByRole("button", { name: "ブラウザーの既定設定に戻す" }));

    expect(screen.getByLabelText("読み上げ方式")).toHaveValue("web-speech");
    expect(screen.getByLabelText("game choice")).toHaveTextContent('"provider":"supertonic"');
    fireEvent.click(screen.getByRole("button", { name: "設定を保存" }));
    expect(screen.getByLabelText("game choice")).toHaveTextContent('"provider":"web-speech"');
    openSettings();
    chooseModel();
    expect(screen.getByLabelText("モデルのフォルダー")).toHaveValue("/supertonic/onnx");
    expect(screen.getByLabelText("声のJSONファイル")).toHaveValue(
      "/supertonic/voice_styles/M1.json",
    );
  });
});
