import { HomePage } from "@/components/home-page";
import { readContent } from "@/lib/content-store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const content = await readContent();
  const reviews = content.reviews
    .filter((item) => item.status === "published" || item.status === "demo")
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));

  return <HomePage site={content.site} reviews={reviews} />;
}
