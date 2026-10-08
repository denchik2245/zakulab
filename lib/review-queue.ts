import "server-only";
import { readJSON, compareAndSetJSON } from "@/lib/atomic-store";
import type { AdminContent } from "@/lib/content-store";
import type { VerifiedReview } from "@/lib/reviews";

export const reviewQueueCapacity = 100;
export const pendingReviewLifetime = 90 * 24 * 60 * 60 * 1000;
const key = (slot: number) => `review-queue/${slot}`;
export async function readReviewQueue() {
  const entries = await Promise.all(Array.from({ length: reviewQueueCapacity }, (_, slot) => readJSON<VerifiedReview>(key(slot))));
  return entries.map((entry) => entry && Date.parse(entry.data.submittedAt) > Date.now() - pendingReviewLifetime ? entry : null);
}

// Fixed slots bound storage use. Each submission claims exactly one slot atomically.
// Moderated records remain in the CMS; a stale CMS snapshot cannot remove a new slot entry.
export async function enqueueReview(review: VerifiedReview, content: AdminContent) {
  if (content.reviews.filter((item) => item.status === "pending").length >= reviewQueueCapacity) return false;
  const known = new Map(content.reviews.map((item) => [item.id, item]));
  for (let slot = 0; slot < reviewQueueCapacity; slot++) {
    const entry = await readJSON<VerifiedReview>(key(slot));
    const processed = entry && (content.dismissedSubmissions?.includes(entry.data.id) || (known.has(entry.data.id) && known.get(entry.data.id)?.status !== "pending"));
    const expired = entry && Date.parse(entry.data.submittedAt) <= Date.now() - pendingReviewLifetime;
    if (entry && !processed && !expired) continue;
    if (await compareAndSetJSON(key(slot), review, entry?.etag ?? null)) return true;
  }
  return false;
}
