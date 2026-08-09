import { isAdminAuthenticated } from "@/lib/admin-auth";
import { readContent, writeContent, type AdminContent } from "@/lib/content-store";

export async function GET() {
  if (!(await isAdminAuthenticated())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  return Response.json(await readContent());
}

export async function PUT(request: Request) {
  if (!(await isAdminAuthenticated())) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json().catch(() => null) as AdminContent | null;
  if (!body || body.version !== 1 || !Array.isArray(body.cases) || !Array.isArray(body.reviews) || !body.site) {
    return Response.json({ error: "Некорректный формат данных" }, { status: 400 });
  }
  return Response.json(await writeContent(body));
}
