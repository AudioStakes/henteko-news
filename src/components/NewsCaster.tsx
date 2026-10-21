import type { SpeechPhase } from "../application";
import { CharacterImage } from "./CharacterImage";

type NewsCasterProps = {
  imageUrl: string;
  welcome?: boolean;
  phase?: SpeechPhase;
};

export function NewsCaster({ imageUrl, welcome = false, phase = "idle" }: NewsCasterProps) {
  const busy = phase !== "idle";
  return (
    <div
      className={`caster${welcome ? " welcome-caster" : ""}${busy ? " with-status" : ""}`}
      data-phase={phase}
    >
      <CharacterImage
        variant={welcome ? "home" : "result"}
        src={imageUrl}
        alt={phase === "speaking" ? "原稿を読むひよこキャスター" : "赤い帽子のひよこキャスター"}
      />
      {busy && (
        <span
          className={`caster-status${phase === "speaking" ? " speaking" : ""}`}
          aria-hidden="true"
        >
          {phase === "preparing" ? "じゅんび中" : "よんでいるよ"}
        </span>
      )}
      <div className="nameplate" aria-hidden="true">
        <span>へんてこニュース</span>
      </div>
    </div>
  );
}
