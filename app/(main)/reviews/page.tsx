import type { Metadata } from "next";
import { ReviewsPageView } from "@/components/reviews-page";
import { readContent } from "@/lib/content-store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Отзывы клиентов",
  description: "Отзывы клиентов о совместной работе с Денисом Закусиловым.",
};

export default async function ReviewsPage() {
  const content = await readContent();
  const reviews = content.reviews
    .filter((item) => (item.status === "published" || item.status === "demo") && item.showOnReviewsPage)
    .sort((a, b) => a.order - b.order);

  return <ReviewsPageView reviews={reviews} site={content.site} />;
}
