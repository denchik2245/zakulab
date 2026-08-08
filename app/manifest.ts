import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Денис Закусилов — zakulab",
    short_name: "zakulab",
    description: "Сайты для бизнеса под ключ",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f2eb",
    theme_color: "#1e46e8",
  };
}
