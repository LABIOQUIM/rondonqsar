import { DEFAULT_SITE_URL, normalizeSiteUrl } from "@/lib/seo";

export function getRuntimeSiteUrl() {
  const configuredSiteUrl = import.meta.env.VITE_SITE_URL;

  if (configuredSiteUrl) {
    return normalizeSiteUrl(configuredSiteUrl);
  }

  if (typeof window !== "undefined") {
    return normalizeSiteUrl(window.location.origin);
  }

  return DEFAULT_SITE_URL;
}

export async function loadRuntimeSeoData() {
  return {
    siteUrl: getRuntimeSiteUrl(),
  };
}
