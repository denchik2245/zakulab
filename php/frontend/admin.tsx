import { createRoot } from "react-dom/client";
import { AdminStudio } from "@/components/admin-studio";
import type { AdminContent } from "@/lib/content-schema";
import { apiFetch } from "./api";

async function start() {
  const response = await apiFetch("/api/admin/content");
  const content: AdminContent | null = response.ok ? await response.json() : null;
  const container = document.getElementById("admin-app");
  if (container) createRoot(container).render(<AdminStudio authenticated={Boolean(content)} initialContent={content} />);
}
void start().catch(() => { const root = document.getElementById("admin-app"); if (root) root.textContent = "Не удалось загрузить панель. Обновите страницу."; });
