import alienHome from '../assets/alien-home.webp';
import alienSelect from '../assets/alien-select.webp';
import alienResult from '../assets/alien-result.webp';

type CharacterVariant = 'home' | 'select' | 'result';

const characterSrc: Record<CharacterVariant, string> = {
  home: alienHome,
  select: alienSelect,
  result: alienResult,
};

type CharacterImageProps = {
  variant: CharacterVariant;
  className?: string;
  alt?: string;
};

export function CharacterImage({ variant, className = '', alt }: CharacterImageProps) {
  const loading = variant === 'home' ? undefined : 'eager';

  return (
    <img
      className={`character character--${variant} ${className}`.trim()}
      src={characterSrc[variant]}
      alt={alt ?? ''}
      aria-hidden={alt ? undefined : true}
      decoding="async"
      fetchPriority={variant === 'home' ? 'high' : 'auto'}
      loading={loading}
    />
  );
}
