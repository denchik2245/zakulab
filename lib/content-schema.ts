import { z } from "zod";
import { hasCasePlaceholders } from "@/lib/cases";
import { normalizeContentUrl } from "@/lib/external-url";

const text = z.string().max(10000);
const id = z.string().min(1).max(120);
const order = z.number().finite();
const link = z.string().max(1000).transform(normalizeContentUrl).refine((value) => {
  if (value === "" || value === "#") return true;
  if (value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")) return true;
  try { return ["https:", "http:"].includes(new URL(value).protocol); } catch { return false; }
}, "Нужна ссылка http(s) или путь сайта");
const image = link;
const unique = <T extends { id: string }>(items: T[]) => new Set(items.map((item) => item.id)).size === items.length;
const list = <T extends z.ZodType<{ id: string }>>(schema: T, max = 200) => z.array(schema).max(max).refine(unique, "Повторяющиеся id");
const spacing = z.enum(["compact", "large"]);
const block = z.discriminatedUnion("type", [
  z.object({ id, type: z.literal("image"), image, alt: text, caption: text, spacing }),
  z.object({ id, type: z.literal("gallery"), images: list(z.object({ id, image, alt: text }), 50), spacing }),
  z.object({ id, type: z.literal("text"), title: text, body: text, listStyle: z.enum(["none", "bullet", "numbered", "labeled"]), items: list(z.object({ id, label: text, text }), 100), spacing }),
  z.object({ id, type: z.literal("callout"), text, spacing }),
]);
const caseStudy = z.object({
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120), index: text, title: text, eyebrow: text,
  summary: text, role: text, year: text, url: link, accent: z.enum(["green", "orange", "coral"]),
  category: z.enum(["corporate", "commerce"]), catalogTask: text, status: z.enum(["published", "draft"]),
  featured: z.boolean(), createdAt: z.iso.datetime(), updatedAt: z.iso.datetime(), whatDone: text.optional(),
  blocks: list(block, 100).optional(), verified: z.array(text).max(100),
  draft: z.object({ challenge: text, approach: text, decisions: z.array(z.object({ title: text, text })).max(100), result: text }),
}).refine((item) => item.status !== "published" || !hasCasePlaceholders(item), "Перед публикацией замените все [УТОЧНИТЬ]");
export const reviewSchema = z.object({
  id, status: z.enum(["published", "pending", "rejected", "demo"]), submittedAt: z.iso.datetime(),
  publishedAt: z.string().refine((value) => value === "" || !Number.isNaN(Date.parse(value))),
  showOnHome: z.boolean(), showOnReviewsPage: z.boolean(), order, text: z.string().max(4000), image: image.optional(),
  author: z.object({ name: text, initials: text, role: text, company: text }),
  project: z.object({ name: text, url: link, caseUrl: link.optional() }),
  profile: z.object({ network: z.enum(["Telegram", "MAX", "VK", "LinkedIn", "Другая сеть"]), label: text, url: link }),
  consent: z.object({ acceptedAt: z.iso.datetime(), version: z.literal("2026-10-08") }).optional(),
});
const project = z.object({
  id, title: text, description: text, image, url: link, platform: text, tags: z.tuple([text, text]),
  filters: z.array(z.enum(["landing", "multipage", "commerce", "interface"])).max(4),
  homePlacement: z.enum(["featured", "list", "hidden"]), portfolioPlacement: z.enum(["featured", "archive", "hidden"]),
  published: z.boolean(), order, caseStudy: caseStudy.optional(),
});
const popup = z.object({ title: text, description: text });
const site = z.object({
  heroTitle: text, heroName: text, heroRole: text, heroPortrait: image, heroGallery: z.array(image).max(50), heroGallerySpeed: z.number().min(5).max(120),
  aboutTitle: text, aboutText: text, stats: list(z.object({ id, value: text, label: text })),
  portfolioTitle: text, portfolioProjects: list(project).refine((items) => {
    const slugs = items.flatMap((item) => item.caseStudy ? [item.caseStudy.slug] : []);
    return new Set(slugs).size === slugs.length;
  }, "Повторяющиеся slug кейсов"),
  processTitle: text, process: list(z.object({ id, title: text, text, image, secondaryTitle: text.optional(), secondaryText: text.optional(), secondaryImage: image.optional() })),
  reviewsTitle: text, reviewsText: text, reviewImage: image,
  servicesTitle: text, servicesText: text, services: list(z.object({ id, title: text, text, price: text, priceSecondary: text, time: text })),
  smallTasksTitle: text, smallTasks: list(z.object({ id, title: text, text, deliverable: text, time: text, price: text })),
  contactTitle: text, contactButton: text, email: text, telegramUrl: link, vkUrl: link, maxUrl: link, kworkUrl: link, flUrl: link,
  styleChoice: z.object({ styles: list(z.object({ id, number: text, title: text, category: text, description: text, traits: z.array(text).max(100),
    preview: z.enum(["editorial", "brutal", "premium", "organic", "technical", "product", "vivid", "catalog"]),
    axes: z.object({ space: order, energy: order, expression: order, emotion: order }), images: z.array(image).max(50), active: z.boolean(), order })) }),
  popups: z.object({ serviceTitlePrefix: text, serviceDescription: text, services: z.record(z.string(), popup), reviewFormTitle: text,
    reviewFormDescription: text, styleResultTitle: text, styleResultDescription: text }),
});
export const contentSchema = z.object({ version: z.literal(1), updatedAt: z.iso.datetime(), revision: z.string().min(1),
  reviewSnapshotIds: z.array(id).max(100), dismissedSubmissions: z.array(id).max(100).optional(), reviews: list(reviewSchema, 500), site });
