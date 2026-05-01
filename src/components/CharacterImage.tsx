import hiyokoHome from '../assets/hiyoko.webp';
import hiyokoSelect from '../assets/hiyoko_question.webp';
import hiyokoResult from '../assets/hiyoko.webp';

type CharacterVariant = 'home' | 'select' | 'result';

const characterSrc: Record<CharacterVariant, string> = {
  home: hiyokoHome,
  select: hiyokoSelect,
  result: hiyokoResult,
};

type CharacterImageProps = {
  variant: CharacterVariant;
  className?: string;
  alt?: string;
};

export function CharacterImage({ variant, className = '', alt }: CharacterImageProps) {
  const loading = variant === 'home' ? undefined : 'eager';
  const fetchPriorityProps = { fetchpriority: variant === 'home' ? 'high' : 'auto' } as Record<string, string>;

  return (
    <img
      className={`character character--${variant} ${className}`.trim()}
      src={characterSrc[variant]}
      alt={alt ?? ''}
      aria-hidden={alt ? undefined : true}
      decoding="async"
      loading={loading}
      {...fetchPriorityProps}
    />
  );
}
