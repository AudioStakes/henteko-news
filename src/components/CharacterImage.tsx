type CharacterVariant = 'home' | 'select' | 'result';

const characterSrc: Record<CharacterVariant, string> = {
  home: new URL('../assets/alien-home.webp', import.meta.url).href,
  select: new URL('../assets/alien-select.webp', import.meta.url).href,
  result: new URL('../assets/alien-result.webp', import.meta.url).href,
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
