import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { AdminStudio } from "@/components/admin-studio";
import type { AdminContent } from "@/lib/content-store";
import { apiFetch } from "./api";

(window as Window & { zakulabPhp?: boolean }).zakulabPhp = true;

function Inbox() {
  const [items, setItems] = useState<Record<string, string>[]>([]);
  const [notice, setNotice] = useState("");
  async function refresh() {
    try {
      const response = await apiFetch("/api/admin/requests");
      if (!response.ok) throw new Error("Не удалось загрузить заявки.");
      setItems((await response.json()).requests);
    } catch (error) { setNotice(String(error)); }
  }
  useEffect(() => { void refresh(); }, []);
  return <section className="php-inbox"><h2>Заявки с сайта</h2><button type="button" onClick={refresh}>Обновить</button> <a href="/api/admin/backup" download>Скачать резервную копию</a><p role="status">{notice}</p>{items.length ? items.map(item => <article key={item.id}><h3>{item.name} · {new Date(item.createdAt).toLocaleDateString("ru-RU")}</h3><p>{item.contact} · {item.messenger} · {item.budget}</p><p>{item.company}</p><p style={{ whiteSpace: "pre-wrap" }}>{item.task}</p>{item.visualProfile && <details><summary>Выбор стиля</summary><pre>{item.visualProfile}</pre></details>}<button type="button" onClick={async () => {
    if (!window.confirm("Удалить эту заявку?")) return;
    const response = await apiFetch("/api/admin/requests/" + encodeURIComponent(item.id), { method: "DELETE" });
    if (response.ok) await refresh(); else setNotice("Не удалось удалить заявку.");
  }}>Удалить заявку</button></article>) : <p>Новых заявок пока нет.</p>}</section>;
}

async function start() {
  const response = await apiFetch("/api/admin/content");
  const content: AdminContent | null = response.ok ? await response.json() : null;
  const container = document.getElementById("admin-app");
  if (container) createRoot(container).render(<><AdminStudio authenticated={Boolean(content)} initialContent={content} /><AuthenticatedInbox /></>);
}
function AuthenticatedInbox() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    let stopped = false;
    const check = () => fetch("/api/admin/session", { cache: "no-store" }).then(response => response.json()).then(data => { if (!stopped) setVisible(data.authenticated); }).catch(() => {});
    void check();
    window.addEventListener("zakulab-auth", check);
    return () => { stopped = true; window.removeEventListener("zakulab-auth", check); };
  }, []);
  return visible ? <Inbox /> : null;
}
void start().catch(() => { const root = document.getElementById("admin-app"); if (root) root.textContent = "Не удалось загрузить панель. Обновите страницу."; });
