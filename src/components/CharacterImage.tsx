type CharacterVariant = "home" | "select" | "result";

type CharacterImageProps = {
  variant: CharacterVariant;
  src: string;
  className?: string;
  alt?: string;
};

export function CharacterImage({ variant, src, className = "", alt }: CharacterImageProps) {
  const loading = variant === "home" ? undefined : "eager";
  const fetchPriorityProps = { fetchpriority: variant === "home" ? "high" : "auto" } as Record<
    string,
    string
  >;

  return (
    <img
      className={`character character--${variant} ${className}`.trim()}
      src={src}
      alt={alt ?? ""}
      aria-hidden={alt ? undefined : true}
      decoding="async"
      loading={loading}
      {...fetchPriorityProps}
    />
  );
}
