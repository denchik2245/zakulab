import { HomePage } from "@/components/home-page";
import { readContent } from "@/lib/content-store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const content = await readContent();
  const reviews = content.reviews
    .filter((item) => (item.status === "published" || item.status === "demo") && item.showOnHome)
    .sort((a, b) => a.order - b.order);

  return <HomePage site={content.site} reviews={reviews} />;
}
