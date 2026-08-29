type MaybeAuthSession =
  | {
      session?: unknown;
      user?: {
        role?: string | null | undefined;
        username?: string | null | undefined;
      } | null;
    }
  | null
  | undefined;

export const ANONYMOUS_CREDENTIALS = {
  identifier: "anonymous",
  // Deve bater com ANONYMOUS_USER.password em apps/api/prisma/seed.ts
  password: "anonymous",
};

export function hasCompleteAuthSession(data: MaybeAuthSession) {
  return Boolean(data?.session && data.user);
}

export function isAdminSession(data: MaybeAuthSession) {
  return hasCompleteAuthSession(data) && data?.user?.role === "admin";
}

export function isAnonymousSession(data: MaybeAuthSession) {
  return hasCompleteAuthSession(data) && data?.user?.username === ANONYMOUS_CREDENTIALS.identifier;
}
