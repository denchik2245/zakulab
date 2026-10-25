import type { AdminContent } from "@/lib/content-schema";

type OrderedItem = { id: string; order: number };

export function normalizeItemOrder<T extends OrderedItem>(items: T[]): T[] {
  return [...items].sort((a, b) => a.order - b.order).map((item, index) => ({ ...item, order: index + 1 }));
}

export function moveItemToPosition<T extends OrderedItem>(items: T[], id: string, position: number): T[] {
  const ordered = normalizeItemOrder(items);
  const index = ordered.findIndex((item) => item.id === id);
  if (index < 0 || !Number.isFinite(position)) return ordered;
  const [item] = ordered.splice(index, 1);
  const target = Math.max(1, Math.min(items.length, Math.trunc(position)));
  ordered.splice(target - 1, 0, item);
  return ordered.map((entry, order) => ({ ...entry, order: order + 1 }));
}

export function normalizeContentOrder(content: AdminContent): AdminContent {
  return {
    ...content,
    reviews: normalizeItemOrder(content.reviews),
    site: {
      ...content.site,
      portfolioProjects: normalizeItemOrder(content.site.portfolioProjects),
      styleChoice: { ...content.site.styleChoice, styles: normalizeItemOrder(content.site.styleChoice.styles) },
    },
  };
}
