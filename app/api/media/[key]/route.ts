import { readMedia } from "@/lib/media-store";

export async function GET(_request: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const media = await readMedia(key);
  if (!media) return new Response("Not found", { status: 404 });

  return new Response(media.data, {
    headers: {
      "Content-Type": media.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
