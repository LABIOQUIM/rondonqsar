const DEFAULT_APP_URL = "http://localhost:3000";

function splitOrigins(value: string | undefined) {
  return (
    value
      ?.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean) ?? []
  );
}

export function getPublicOrigins() {
  return Array.from(
    new Set([
      ...splitOrigins(process.env.APP_URL),
      ...splitOrigins(process.env.BETTER_AUTH_URL),
      ...splitOrigins(process.env.SITE_URL),
      ...splitOrigins(process.env.WEB_PUBLIC_URL),
      DEFAULT_APP_URL,
    ]),
  );
}
