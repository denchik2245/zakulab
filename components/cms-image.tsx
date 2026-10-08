import Image, { type ImageProps } from "next/image";

// External CMS images load directly in the browser; the server optimizer stays closed to arbitrary hosts.
export function CmsImage(props: ImageProps) {
  const external = typeof props.src === "string" && /^https?:\/\//i.test(props.src);
  return <Image {...props} unoptimized={external || props.unoptimized} />;
}
