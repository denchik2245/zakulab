import { contentSchema } from "@/lib/content-schema";
import { z } from "zod";

// The frozen seed must stay a valid CMS document as the schema evolves.
export function checkSeed(seed: Record<string, unknown>) {
  const result = contentSchema.safeParse({ ...seed, revision: "seed", reviewSnapshotIds: [] });
  if (!result.success) throw new Error("php/seed.json does not match the content schema:\n" + z.prettifyError(result.error));
}
export const schema = z.toJSONSchema(contentSchema, { io: "input", unrepresentable: "any" });
