export function externalUrl(value: string) {
  const url = value.trim();
  if (!url || url.startsWith("/") || /^[a-z][a-z\d+.-]*:/i.test(url)) return url;
  return `https://${url}`;
}

export function normalizeContentUrl(value: string) {
  if (!value || value === "#") return value;
  if (/^https?:\/\/$/i.test(value.trim())) return "";
  return externalUrl(value);
}
