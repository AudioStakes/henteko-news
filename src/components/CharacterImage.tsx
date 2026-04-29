type CharacterVariant = 'home' | 'select' | 'result';

const characterSrc: Record<CharacterVariant, string> = {
  home: '/assets/alien-home.webp',
  select: '/assets/alien-select.webp',
  result: '/assets/alien-result.webp',
};

type CharacterImageProps = {
  variant: CharacterVariant;
  className?: string;
  alt?: string;
};

export function CharacterImage({ variant, className = '', alt }: CharacterImageProps) {
  return (
    <img
      className={`character character--${variant} ${className}`.trim()}
      src={characterSrc[variant]}
      alt={alt ?? ''}
      aria-hidden={alt ? undefined : true}
    />
  );
}
