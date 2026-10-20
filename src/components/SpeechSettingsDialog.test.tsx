import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_SPEECH_SETTINGS,
  type SpeechSettings,
  validateSpeechSettings,
} from "../application/speechSettings";
import { AppHeader } from "./AppHeader";

const showModalDescriptor = Object.getOwnPropertyDescriptor(
  HTMLDialogElement.prototype,
  "showModal",
);
const closeDescriptor = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, "close");

const saveSettings = vi.fn(validateSpeechSettings);

function SettingsHarness({ initialSettings }: { initialSettings: SpeechSettings }) {
  const [settings, setSettings] = useState(initialSettings);
  return (
    <>
      <AppHeader
        settings={settings}
        defaults={DEFAULT_SPEECH_SETTINGS}
        onSave={(next) => {
          const result = saveSettings(next);
          if (result.ok) {
            setSettings(result.settings);
          }
          return result;
        }}
      />
      <output aria-label="saved settings">{JSON.stringify(settings)}</output>
    </>
  );
}

function renderSettings(initialSettings: SpeechSettings = DEFAULT_SPEECH_SETTINGS) {
  return render(<SettingsHarness initialSettings={initialSettings} />);
}

function openSettings() {
  const button = screen.getByRole("button", { name: "音声設定" });
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
    saveSettings.mockClear();
  });

  it("passes its draft to the API and restores the normalized settings prop on reopening", () => {
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
    expect(screen.getByLabelText("saved settings")).toHaveTextContent('"provider":"web-speech"');
    expect(saveSettings).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "設定を保存" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "音声設定" })).toHaveFocus();
    expect(screen.getByLabelText("saved settings")).toHaveTextContent('"provider":"supertonic"');
    expect(saveSettings).toHaveBeenCalledExactlyOnceWith({
      provider: "supertonic",
      modelBasePath: "  https://models.example.com/onnx  ",
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
    expect(screen.getByLabelText("saved settings")).toHaveTextContent('"provider":"web-speech"');
    expect(saveSettings).not.toHaveBeenCalled();
    openSettings();
    expect(screen.getByLabelText("読み上げ方式")).toHaveValue("web-speech");
    chooseModel();
    expect(screen.getByLabelText("モデルのフォルダー")).toHaveValue("/supertonic/onnx");
  });

  it.each([
    { model: "javascript:alert(1)", voice: "", modelInvalid: true, voiceInvalid: true },
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
      expect(screen.getByLabelText("saved settings")).toHaveTextContent('"provider":"web-speech"');
    },
  );

  it("shows provider errors returned by the API and focuses the provider field", () => {
    saveSettings.mockReturnValueOnce({
      ok: false,
      errors: { provider: "この方式は利用できません。", modelBasePath: "", voiceStylePath: "" },
    });
    renderSettings();
    openSettings();

    fireEvent.click(screen.getByRole("button", { name: "設定を保存" }));

    expect(screen.getByRole("dialog", { name: "音声設定" })).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("この方式は利用できません。");
    expect(screen.getByLabelText("読み上げ方式")).toHaveFocus();
    expect(screen.getByLabelText("読み上げ方式")).toHaveAttribute("aria-invalid", "true");
  });

  it("resets to browser defaults only after saving", () => {
    renderSettings({
      provider: "supertonic",
      modelBasePath: "/custom/onnx",
      voiceStylePath: "/custom/F1.json",
    });
    openSettings();

    fireEvent.click(screen.getByRole("button", { name: "ブラウザーの既定設定に戻す" }));

    expect(screen.getByLabelText("読み上げ方式")).toHaveValue("web-speech");
    expect(screen.getByLabelText("saved settings")).toHaveTextContent('"provider":"supertonic"');
    expect(saveSettings).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "設定を保存" }));
    expect(screen.getByLabelText("saved settings")).toHaveTextContent('"provider":"web-speech"');
    openSettings();
    chooseModel();
    expect(screen.getByLabelText("モデルのフォルダー")).toHaveValue("/supertonic/onnx");
    expect(screen.getByLabelText("声のJSONファイル")).toHaveValue(
      "/supertonic/voice_styles/M1.json",
    );
  });
});
