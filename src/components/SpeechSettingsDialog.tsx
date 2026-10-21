import { type RefObject, type SubmitEvent, useEffect, useId, useRef, useState } from "react";
import type { SpeechSettings, SpeechSettingsApi, SpeechSettingsErrors } from "../application";
import "./SpeechSettingsDialog.css";

type SpeechSettingsDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
  settings: SpeechSettings;
  defaults: SpeechSettings;
  onSave: SpeechSettingsApi["saveSettings"];
};

export function SpeechSettingsDialog({
  isOpen,
  onClose,
  returnFocusRef,
  settings,
  defaults,
  onSave,
}: SpeechSettingsDialogProps) {
  const [draft, setDraft] = useState<SpeechSettings>(settings);
  const [errors, setErrors] = useState<SpeechSettingsErrors>({
    modelBasePath: "",
    voiceStylePath: "",
  });
  const [previousProps, setPreviousProps] = useState({ isOpen, settings });
  const dialogRef = useRef<HTMLDialogElement>(null);
  const providerInputRef = useRef<HTMLSelectElement>(null);
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
    const result = onSave(draft);
    if (!result.ok) {
      setErrors(result.errors);
      if (result.errors.provider !== undefined) {
        providerInputRef.current?.focus();
      } else {
        (result.errors.modelBasePath.length > 0 ? modelInputRef : voiceInputRef).current?.focus();
      }
      return;
    }
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
            ref={providerInputRef}
            id={`${id}-provider`}
            value={draft.provider}
            aria-invalid={Boolean(errors.provider)}
            aria-describedby={errors.provider === undefined ? undefined : `${id}-provider-error`}
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
          {draft.provider === "web-speech" && (
            <p className="speech-settings-dialog__help">端末の音声で読み上げます。</p>
          )}
          {errors.provider !== undefined && (
            <p id={`${id}-provider-error`} className="speech-settings-dialog__error" role="alert">
              {errors.provider}
            </p>
          )}
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
            setDraft({ ...defaults });
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
