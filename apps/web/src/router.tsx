import { QueryCache, QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";

import { clearCachedAppBootstrap } from "@/lib/api";
import { routeTree } from "@/routeTree.gen";

function isUnauthorizedError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);

  return /\b(401|403|unauthorized|forbidden)\b/i.test(message);
}

function handleUnauthorizedQueryError(queryClient: QueryClient, error: unknown) {
  if (typeof window === "undefined" || !isUnauthorizedError(error)) {
    return;
  }

  clearCachedAppBootstrap(queryClient);

  if (window.location.pathname.startsWith("/app")) {
    window.location.assign("/auth/login");
  }
}

export function getRouter() {
  let queryClient: QueryClient;

  const queryCache = new QueryCache({
    onError: (error) => handleUnauthorizedQueryError(queryClient, error),
  });

  queryClient = new QueryClient({
    queryCache,
    defaultOptions: {
      queries: {
        gcTime: 300_000,
        refetchOnWindowFocus: false,
        staleTime: 30_000,
      },
    },
  });

  return createRouter({
    routeTree,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 30_000,
    defaultStaleTime: 30_000,
    scrollRestoration: true,
    context: {
      queryClient,
    },
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
