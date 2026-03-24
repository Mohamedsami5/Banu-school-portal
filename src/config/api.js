export const API_BASE = import.meta.env.VITE_API_BASE || "/api";
export const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || "";

export function withOrigin(path) {
  if (!path) return path;
  if (String(path).startsWith("http")) return path;
  const normalized = String(path).startsWith("/") ? String(path) : `/${path}`;
  return `${API_ORIGIN}${normalized}`;
}
