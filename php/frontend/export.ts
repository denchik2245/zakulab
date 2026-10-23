import { readContent } from "@/lib/content-store";
import { contentSchema } from "@/lib/content-schema";
import { z } from "zod";

export { readContent };
export const schema = z.toJSONSchema(contentSchema, { io: "input", unrepresentable: "any" });
