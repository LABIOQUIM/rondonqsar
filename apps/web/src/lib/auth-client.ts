import { adminClient, twoFactorClient, usernameClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

import { DEFAULT_SITE_URL } from "./seo";

const DEFAULT_API_BASE_URL = typeof window === "undefined" ? `${DEFAULT_SITE_URL}/api` : "/api";
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(/\/$/, "");

export const authClient = createAuthClient({
  baseURL: `${API_BASE_URL}/auth`,
  plugins: [adminClient(), twoFactorClient(), usernameClient()],
});

export type AuthSession = typeof authClient.$Infer.Session | null;
