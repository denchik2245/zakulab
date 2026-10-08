import { isAdminAuthenticated } from "@/lib/admin-auth";
import { readContent, writeContent, ContentConflictError } from "@/lib/content-store";
import { contentSchema } from "@/lib/content-schema";
import { limitedBody, RequestTooLargeError } from "@/lib/request-limits";

export async function GET() {
  if (!(await isAdminAuthenticated())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json(await readContent(true), { headers: { "Cache-Control": "no-store" } });
}

export async function PUT(request: Request) {
  if (!(await isAdminAuthenticated())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = JSON.parse(await limitedBody(request, 4 * 1024 * 1024));
    const result = contentSchema.safeParse(body);
    if (!result.success) return Response.json({ error: "Некорректные данные", details: result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).slice(0, 20) }, { status: 400 });
    return Response.json(await writeContent(result.data));
  } catch (error) {
    if (error instanceof ContentConflictError) return Response.json({ error: error.message }, { status: 409 });
    if (error instanceof RequestTooLargeError) return Response.json({ error: "Документ превышает 4 МБ" }, { status: 413 });
    if (error instanceof SyntaxError) return Response.json({ error: "Некорректный JSON" }, { status: 400 });
    throw error;
  }
}
