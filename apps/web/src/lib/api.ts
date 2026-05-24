import { createServerFn } from "@tanstack/react-start";

type ApiRequestOptions = {
  body?: BodyInit | Record<string, unknown>;
  headers?: HeadersInit;
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  params?: Record<string, string | number | boolean | undefined>;
};

type AuthSession = {
  session: {
    id: string;
    token?: string;
    userId: string;
    expiresAt: string | Date;
  };
  user: {
    id: string;
    name: string;
    email: string;
    username?: string | null;
    role?: string | null;
  };
};

export type ServerAuthSession = AuthSession | null;

export type SerializableJson =
  | string
  | number
  | boolean
  | null
  | SerializableJson[]
  | { [key: string]: SerializableJson };

export interface FlagConfig {
  type: string;
  defaultVariant: string;
  variants: Record<string, SerializableJson>;
  disabled: boolean;
}

const DEFAULT_INTERNAL_API_URL = "http://api:3000";
const API_REQUEST_TIMEOUT_MS = 8000;

function getInternalApiUrl() {
  return (process.env.API_INTERNAL_URL ?? DEFAULT_INTERNAL_API_URL).replace(/\/$/, "");
}

function createApiUrl(path: string, params?: ApiRequestOptions["params"]) {
  const url = new URL(path, getInternalApiUrl());

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url;
}

function getApiConnectionError(error: unknown) {
  const apiUrl = getInternalApiUrl();
  const message = error instanceof Error && error.message ? error.message : "fetch failed";

  return new Error(`Could not reach the RondonQSAR API at ${apiUrl}. ${message}`);
}

async function getForwardedHeaders(extraHeaders?: HeadersInit) {
  const { getRequestHeader } = await import("@tanstack/react-start/server");
  const headers = new Headers(extraHeaders);
  const cookie = getRequestHeader("cookie");
  const origin = getRequestHeader("origin");
  const referer = getRequestHeader("referer");
  const forwardedFor = getRequestHeader("x-forwarded-for");
  const forwardedHost = getRequestHeader("x-forwarded-host");
  const forwardedProto = getRequestHeader("x-forwarded-proto");

  if (cookie) headers.set("cookie", cookie);
  if (origin) headers.set("origin", origin);
  if (referer) headers.set("referer", referer);
  if (forwardedFor) headers.set("x-forwarded-for", forwardedFor);
  if (forwardedHost) headers.set("x-forwarded-host", forwardedHost);
  if (forwardedProto) headers.set("x-forwarded-proto", forwardedProto);

  return headers;
}

async function readResponsePayload(response: Response) {
  const contentType = response.headers.get("content-type");

  if (response.status === 204) {
    return undefined;
  }

  if (contentType?.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text || undefined;
}

function extractErrorMessage(payload: unknown, response: Response) {
  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>;
    if (typeof record.message === "string") return record.message;
    if (typeof record.error === "string") return record.error;
  }

  if (typeof payload === "string") {
    return payload;
  }

  return `${response.status} ${response.statusText}`;
}

async function forwardSetCookieHeaders(response: Response) {
  const { setResponseHeader } = await import("@tanstack/react-start/server");
  const headers = response.headers as Headers & { getSetCookie?: () => string[] };
  const cookies =
    typeof headers.getSetCookie === "function"
      ? headers.getSetCookie()
      : response.headers.get("set-cookie")
        ? [response.headers.get("set-cookie") as string]
        : [];

  if (cookies.length > 0) {
    setResponseHeader("set-cookie", cookies);
  }
}

async function request<T>(path: string, options: ApiRequestOptions = {}) {
  const headers = await getForwardedHeaders(options.headers);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_REQUEST_TIMEOUT_MS);
  let body: BodyInit | undefined;

  if (options.body instanceof FormData || typeof options.body === "string") {
    body = options.body;
  } else if (options.body) {
    headers.set("content-type", "application/json");
    body = JSON.stringify(options.body);
  }

  const init: RequestInit = {
    method: options.method ?? "GET",
    headers,
    signal: controller.signal,
  };

  if (body !== undefined) {
    init.body = body;
  }

  let response: Response;
  try {
    response = await fetch(createApiUrl(path, options.params), init);
  } catch (error) {
    throw getApiConnectionError(error);
  } finally {
    clearTimeout(timeout);
  }

  const payload = await readResponsePayload(response);

  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, response));
  }

  return payload as T;
}

export function apiRequest<T>(path: string, options: ApiRequestOptions = {}) {
  return request<T>(`/v1${path}`, options);
}

export async function authRequest<T>(path: string, options: ApiRequestOptions = {}) {
  const headers = await getForwardedHeaders(options.headers);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_REQUEST_TIMEOUT_MS);
  let body: BodyInit | undefined;

  if (options.body instanceof FormData || typeof options.body === "string") {
    body = options.body;
  } else if (options.body) {
    headers.set("content-type", "application/json");
    body = JSON.stringify(options.body);
  }

  const init: RequestInit = {
    method: options.method ?? "GET",
    headers,
    signal: controller.signal,
  };

  if (body !== undefined) {
    init.body = body;
  }

  let response: Response;
  try {
    response = await fetch(createApiUrl(`/auth${path}`, options.params), init);
  } catch (error) {
    throw getApiConnectionError(error);
  } finally {
    clearTimeout(timeout);
  }

  await forwardSetCookieHeaders(response);

  const payload = await readResponsePayload(response);
  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, response));
  }

  return payload as T;
}

export const getServerSession = createServerFn({ method: "GET" }).handler(async () =>
  authRequest<ServerAuthSession>("/get-session"),
);

export const getOptionalServerSession = createServerFn({ method: "GET" }).handler(async () => {
  try {
    return await authRequest<ServerAuthSession>("/get-session");
  } catch (error) {
    console.warn(error instanceof Error ? error.message : error);
    return null;
  }
});

export const signOut = createServerFn({ method: "POST" }).handler(async () =>
  authRequest<{ success: boolean }>("/sign-out", { method: "POST" }),
);

export const getClientFeatureFlags = createServerFn({ method: "GET" }).handler(async () =>
  apiRequest<Record<string, FlagConfig>>("/feature-flags/client"),
);

export function isEnabledFlag(
  flags: Record<string, FlagConfig>,
  key: string,
  defaultValue: boolean,
) {
  const flag = flags[key];
  if (!flag || flag.disabled) return defaultValue;
  const value = flag.variants[flag.defaultVariant];
  return typeof value === "boolean" ? value : defaultValue;
}
