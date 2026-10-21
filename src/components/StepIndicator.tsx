type StepIndicatorProps = { current: number; total: number };

export function StepIndicator({ current, total }: StepIndicatorProps) {
  return (
    <ol className="step-indicator" aria-label={`ニュースづくり ${current + 1} / ${total}もんめ`}>
      {Array.from({ length: total }, (_, index) => index + 1).map((step) => (
        <li
          key={step}
          className={`step-indicator__dot${step - 1 < current ? " is-done" : step - 1 === current ? " is-current" : ""}`}
          aria-current={step - 1 === current ? "step" : undefined}
        >
          <span className="sr-only">{step}つめ</span>
        </li>
      ))}
      <li className="step-indicator__count" aria-hidden="true">
        {current + 1}/{total}
      </li>
    </ol>
  );
}
