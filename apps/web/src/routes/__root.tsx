import "./__root.module.css";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import "@mantine/tiptap/styles.css";
import type { QueryClient } from "@tanstack/react-query";
import type { ComponentProps, ReactNode } from "react";

import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { OpenFeature, OpenFeatureProvider } from "@openfeature/react-sdk";
import { QueryClientProvider } from "@tanstack/react-query";
import { createRootRouteWithContext, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";
import utc from "dayjs/plugin/utc";

import { AppErrorBoundary } from "@/components/ErrorBoundary";
import { ApiFeatureFlagProvider } from "@/lib/feature-flags";
import {
  buildPageTitle,
  DEFAULT_OG_IMAGE_PATH,
  DEFAULT_SEO_DESCRIPTION,
  SITE_NAME,
} from "@/lib/seo";
import { theme } from "@/theme";

dayjs.extend(duration);
dayjs.extend(relativeTime);
dayjs.extend(utc);

type RouterContext = {
  queryClient: QueryClient;
};

OpenFeature.setProvider(new ApiFeatureFlagProvider());

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { title: buildPageTitle() },
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1.0" },
      { name: "description", content: DEFAULT_SEO_DESCRIPTION },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:type", content: "website" },
      { property: "og:image", content: DEFAULT_OG_IMAGE_PATH },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: DEFAULT_OG_IMAGE_PATH },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "shortcut icon", type: "image/svg+xml", href: "/favicon.svg" },
    ],
  }),
  errorComponent: RootErrorComponent,
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <RootProviders>
        <Outlet />
      </RootProviders>
    </RootDocument>
  );
}

function RootErrorComponent(props: Readonly<ComponentProps<typeof AppErrorBoundary>>) {
  return (
    <RootDocument>
      <RootProviders>
        <AppErrorBoundary {...props} />
      </RootProviders>
    </RootDocument>
  );
}

function RootProviders({ children }: Readonly<{ children: ReactNode }>) {
  const { queryClient } = Route.useRouteContext();

  return (
    <MantineProvider theme={theme}>
      <Notifications />
      <OpenFeatureProvider>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </OpenFeatureProvider>
    </MantineProvider>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
