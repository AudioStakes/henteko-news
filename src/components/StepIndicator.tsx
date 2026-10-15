type StepIndicatorProps = {
  current: number;
  total: number;
};

export function StepIndicator({ current, total }: StepIndicatorProps) {
  const steps = Array.from({ length: total }, (_, i) => i + 1);

  return (
    <ol className="step-indicator" aria-label={`ニュースづくり ${current + 1} / ${total}もんめ`}>
      {steps.map((step, index) => (
        <li key={step} className="step-indicator__item">
          <span
            className={`step-indicator__dot${index === current ? " is-current" : ""}`}
            aria-current={index === current ? "step" : undefined}
          >
            {step}
          </span>
          {index < total - 1 && <span className="step-indicator__line" aria-hidden="true" />}
        </li>
      ))}
    </ol>
  );
}
