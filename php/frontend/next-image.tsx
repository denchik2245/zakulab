import type { CSSProperties, ImgHTMLAttributes } from "react";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string | { src: string; width?: number; height?: number };
  fill?: boolean;
  priority?: boolean;
  quality?: number;
  unoptimized?: boolean;
};

export default function Image({ src, fill, priority, quality: _quality, unoptimized: _unoptimized, style, ...props }: Props) {
  const url = typeof src === "string" ? src : src.src;
  const optimized = typeof window !== "undefined" ? (window as Window & { zakulabImages?: Record<string, { src: string; srcset: string }> }).zakulabImages?.[url] : undefined;
  const fillStyle: CSSProperties = fill ? { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" } : {};
  return <img {...props} src={optimized?.src || url || undefined} srcSet={optimized?.srcset || props.srcSet} sizes={props.sizes || (optimized ? "(max-width: 767px) 100vw, 50vw" : undefined)} style={{ ...fillStyle, ...style }} loading={priority ? "eager" : (props.loading ?? "lazy")} fetchPriority={priority ? "high" : props.fetchPriority} decoding="async" />;
}
