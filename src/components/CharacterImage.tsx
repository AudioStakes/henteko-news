type CharacterVariant = "home" | "select" | "result";

type CharacterImageProps = {
  variant: CharacterVariant;
  src: string;
  className?: string;
  alt?: string;
};

export function CharacterImage({ variant, src, className = "", alt }: CharacterImageProps) {
  const loading = variant === "home" ? undefined : "eager";
  const fetchPriority = variant === "home" ? "high" : "auto";

  return (
    <img
      className={`character character--${variant} ${className}`.trim()}
      src={src}
      alt={alt ?? ""}
      aria-hidden={alt !== undefined && alt.length > 0 ? undefined : true}
      decoding="async"
      loading={loading}
      fetchPriority={fetchPriority}
      draggable={false}
    />
  );
}
