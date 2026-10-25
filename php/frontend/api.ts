let token = "";

export async function apiFetch(url: string, init: RequestInit = {}) {
  if (init.method && init.method !== "GET" && url !== "/api/admin/login" && !token) {
    const response = await fetch("/api/admin/session", { cache: "no-store" });
    const session = await response.json();
    token = session.csrfToken || "";
  }
  const headers = new Headers(init.headers);
  if (token) headers.set("X-CSRF-Token", token);
  const response = await fetch(url, { ...init, headers });
  if (url === "/api/admin/login" && response.ok) {
    const data = await response.clone().json();
    token = data.csrfToken || "";
  }
  if (url === "/api/admin/logout" || response.status === 401) token = "";
  return response;
}
