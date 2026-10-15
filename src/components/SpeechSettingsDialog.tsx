import { type RefObject, type SubmitEvent, useEffect, useId, useRef, useState } from "react";
import { useSpeechSettings } from "../context/SpeechSettingsContext";
import {
  DEFAULT_SPEECH_SETTINGS,
  isSpeechAssetPath,
  type SpeechSettings,
} from "../utils/speechSettings";

type SpeechSettingsDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
};

export function SpeechSettingsDialog({
  isOpen,
  onClose,
  returnFocusRef,
}: SpeechSettingsDialogProps) {
  const { settings, updateSettings } = useSpeechSettings();
  const [draft, setDraft] = useState<SpeechSettings>(settings);
  const [errors, setErrors] = useState({ modelBasePath: "", voiceStylePath: "" });
  const [previousProps, setPreviousProps] = useState({ isOpen, settings });
  const dialogRef = useRef<HTMLDialogElement>(null);
  const modelInputRef = useRef<HTMLInputElement>(null);
  const voiceInputRef = useRef<HTMLInputElement>(null);
  const id = useId();

  if (previousProps.isOpen !== isOpen || previousProps.settings !== settings) {
    setPreviousProps({ isOpen, settings });
    if (isOpen) {
      setDraft({ ...settings });
      setErrors({ modelBasePath: "", voiceStylePath: "" });
    }
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else if (dialog.open) {
      dialog.close();
      returnFocusRef.current?.focus();
    }
  }, [isOpen, settings, returnFocusRef]);

  const save = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next = {
      ...draft,
      modelBasePath: draft.modelBasePath.trim(),
      voiceStylePath: draft.voiceStylePath.trim(),
    };
    const nextErrors = { modelBasePath: "", voiceStylePath: "" };
    if (next.provider === "supertonic") {
      if (!isSpeechAssetPath(next.modelBasePath, true)) {
        nextErrors.modelBasePath =
          "モデルのフォルダーをパスまたはHTTP(S) URLで入力してください。?や#は使えません。";
      }
      if (!isSpeechAssetPath(next.voiceStylePath)) {
        nextErrors.voiceStylePath =
          "声のJSONファイルをパスまたはHTTP(S) URLで入力してください。#は使えません。";
      }
    }
    setErrors(nextErrors);
    if (nextErrors.modelBasePath.length > 0 || nextErrors.voiceStylePath.length > 0) {
      (nextErrors.modelBasePath.length > 0 ? modelInputRef : voiceInputRef).current?.focus();
      return;
    }
    updateSettings(next);
    onClose();
  };
  const hasModelPathError = errors.modelBasePath.length > 0;
  const hasVoicePathError = errors.voiceStylePath.length > 0;

  return (
    <dialog
      ref={dialogRef}
      className="speech-settings-dialog"
      aria-labelledby={`${id}-title`}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
    >
      <form className="speech-settings-dialog__form" onSubmit={save} noValidate>
        <div className="speech-settings-dialog__header">
          <h2 id={`${id}-title`}>音声設定</h2>
          <button
            type="button"
            className="speech-settings-dialog__close"
            aria-label="音声設定を閉じる"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="speech-settings-dialog__field">
          <label htmlFor={`${id}-provider`}>読み上げ方式</label>
          <select
            id={`${id}-provider`}
            value={draft.provider}
            onChange={(event) => {
              setDraft((current) => ({
                ...current,
                provider: event.target.value === "supertonic" ? "supertonic" : "web-speech",
              }));
            }}
          >
            <option value="web-speech">ブラウザーの音声（Web Speech API）</option>
            <option value="supertonic">モデル音声（Supertonic）</option>
          </select>
        </div>
        {draft.provider === "supertonic" && (
          <>
            <p className="speech-settings-dialog__help">
              対応するSupertonicモデルだけを利用できます。はじめての読み上げ時は、モデルの読み込みに時間がかかります。
            </p>
            <p id={`${id}-path-help`} className="speech-settings-dialog__help">
              公開済みの相対パス・/から始まるパス、またはHTTP(S) URLを入力してください。
            </p>
            <div className="speech-settings-dialog__field">
              <label htmlFor={`${id}-model`}>モデルのフォルダー</label>
              <input
                ref={modelInputRef}
                id={`${id}-model`}
                type="text"
                inputMode="url"
                autoCapitalize="none"
                spellCheck={false}
                value={draft.modelBasePath}
                aria-invalid={Boolean(errors.modelBasePath)}
                aria-describedby={`${id}-path-help${hasModelPathError ? ` ${id}-model-error` : ""}`}
                onChange={(event) => {
                  setDraft((current) => ({ ...current, modelBasePath: event.target.value }));
                }}
              />
              {hasModelPathError && (
                <p id={`${id}-model-error`} className="speech-settings-dialog__error" role="alert">
                  {errors.modelBasePath}
                </p>
              )}
            </div>
            <div className="speech-settings-dialog__field">
              <label htmlFor={`${id}-voice`}>声のJSONファイル</label>
              <input
                ref={voiceInputRef}
                id={`${id}-voice`}
                type="text"
                inputMode="url"
                autoCapitalize="none"
                spellCheck={false}
                value={draft.voiceStylePath}
                aria-invalid={Boolean(errors.voiceStylePath)}
                aria-describedby={`${id}-path-help${hasVoicePathError ? ` ${id}-voice-error` : ""}`}
                onChange={(event) => {
                  setDraft((current) => ({ ...current, voiceStylePath: event.target.value }));
                }}
              />
              {hasVoicePathError && (
                <p id={`${id}-voice-error`} className="speech-settings-dialog__error" role="alert">
                  {errors.voiceStylePath}
                </p>
              )}
            </div>
          </>
        )}
        <button
          type="button"
          className="speech-settings-dialog__reset"
          onClick={() => {
            setDraft({ ...DEFAULT_SPEECH_SETTINGS });
            setErrors({ modelBasePath: "", voiceStylePath: "" });
          }}
        >
          ブラウザーの既定設定に戻す
        </button>
        <p className="speech-settings-dialog__help">「設定を保存」で反映します。</p>
        <div className="speech-settings-dialog__actions">
          <button type="button" onClick={onClose}>
            キャンセル
          </button>
          <button type="submit" className="speech-settings-dialog__save">
            設定を保存
          </button>
        </div>
      </form>
    </dialog>
  );
}
