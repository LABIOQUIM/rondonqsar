export const PUBLIC_API_URL_FALLBACK = "http://localhost:4000";

function normalizeApiUrl(value: string | undefined) {
  const trimmed = value?.trim();

  if (!trimmed) {
    return undefined;
  }

  return trimmed.replace(/\/+$/, "");
}

export function getPublicApiUrl() {
  if (typeof window !== "undefined") {
    return normalizeApiUrl(window.__APP_SETTINGS__?.apiUrl) ?? PUBLIC_API_URL_FALLBACK;
  }

  return PUBLIC_API_URL_FALLBACK;
}
