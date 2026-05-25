import { adminClient, twoFactorClient, usernameClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "/api").replace(/\/$/, "");

export const authClient = createAuthClient({
  baseURL: `${API_BASE_URL}/auth`,
  plugins: [adminClient(), twoFactorClient(), usernameClient()],
});

export type AuthSession = typeof authClient.$Infer.Session | null;
