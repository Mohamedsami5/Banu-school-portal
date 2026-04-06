function normalizeApiBase(input) {
  const raw = (input && String(input).trim()) || "";
  if (!raw) return "/api";

  // If the user provides an origin (ex: http://localhost:5000), make sure `/api` is included
  const withoutTrailingSlash = raw.endsWith("/") ? raw.slice(0, -1) : raw;
  if (withoutTrailingSlash.endsWith("/api")) return withoutTrailingSlash;
  if (withoutTrailingSlash === "/api") return "/api";

  return `${withoutTrailingSlash}/api`;
}

export const API_BASE = normalizeApiBase(import.meta.env.VITE_API_BASE);
export const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || "";

export function withOrigin(path) {
  if (!path) return path;
  if (String(path).startsWith("http")) return path;
  const normalized = String(path).startsWith("/") ? String(path) : `/${path}`;
  return `${API_ORIGIN}${normalized}`;
}
