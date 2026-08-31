import { isAdminAuthenticated } from "@/lib/admin-auth";
import { maxMediaSize, saveMedia } from "@/lib/media-store";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ error: "Выберите изображение" }, { status: 400 });
  }

  try {
    return Response.json(await saveMedia(file));
  } catch (error) {
    if ((error as Error).message === "UNSUPPORTED_MEDIA_TYPE") {
      return Response.json({ error: "Поддерживаются PNG, JPG, WebP и GIF" }, { status: 415 });
    }
    if ((error as Error).message === "MEDIA_TOO_LARGE") {
      return Response.json({ error: `Файл должен быть меньше ${maxMediaSize / 1024 / 1024} МБ` }, { status: 413 });
    }
    throw error;
  }
}
