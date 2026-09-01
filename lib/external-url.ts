export function externalUrl(value: string) {
  const url = value.trim();
  if (!url || url.startsWith("/") || /^[a-z][a-z\d+.-]*:/i.test(url)) return url;
  return `https://${url}`;
}
