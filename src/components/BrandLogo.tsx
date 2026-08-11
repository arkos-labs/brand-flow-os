type BrandLogoProps = {
  compact?: boolean;
  className?: string;
  priority?: boolean;
};

export function BrandLogo({ compact = false, className = "", priority = false }: BrandLogoProps) {
  const src = compact ? "/brand/clearquote-mark.png" : "/brand/clearquote-logo.png";
  const alt = compact ? "Symbole ClearQuote" : "ClearQuote";

  return (
    <img
      src={src}
      alt={alt}
      className={`object-contain ${className}`}
      loading={priority ? "eager" : "lazy"}
    />
  );
}
