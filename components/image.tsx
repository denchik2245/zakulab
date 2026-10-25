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
  const optimized = typeof window !== "undefined" ? (window as Window & { zakulabImages?: Record<string, { src?: string; srcset?: string; width?: number; height?: number }> }).zakulabImages?.[url] : undefined;
  const intrinsicWidth = (typeof src === "object" ? src.width : undefined) ?? optimized?.width;
  const intrinsicHeight = (typeof src === "object" ? src.height : undefined) ?? optimized?.height;
  const hasRatio = Boolean(intrinsicWidth && intrinsicHeight);
  const width = props.width ?? (hasRatio && props.height ? Math.round(Number(props.height) * intrinsicWidth! / intrinsicHeight!) : intrinsicWidth);
  const height = props.height ?? (hasRatio && props.width ? Math.round(Number(props.width) * intrinsicHeight! / intrinsicWidth!) : intrinsicHeight);
  const fillStyle: CSSProperties = fill ? { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" } : {};
  return <img {...props} width={width} height={height} src={optimized?.src || url || undefined} srcSet={optimized?.srcset || props.srcSet} sizes={props.sizes || (optimized?.srcset ? "(max-width: 767px) 100vw, 50vw" : undefined)} style={{ ...fillStyle, ...style }} loading={priority ? "eager" : (props.loading ?? "lazy")} fetchPriority={priority ? "high" : props.fetchPriority} decoding="async" />;
}
