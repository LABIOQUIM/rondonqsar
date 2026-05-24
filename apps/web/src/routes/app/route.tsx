import { AppShell, Burger, Group } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useFlag } from "@openfeature/react-sdk";
import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useEffect } from "react";

import { Alert } from "@/components/Alert";
import { Heading } from "@/components/Heading";
import { Logo } from "@/components/Logo";
import { Navbar } from "@/components/Navbar";
import { PageLayout } from "@/components/PageLayout";
import { ServerTime } from "@/components/ServerTime";
import {
  getAppBootstrapQueryOptions,
  getCachedAppBootstrap,
  isAppBootstrapFresh,
  refreshAppBootstrapInBackground,
  setCachedAppBootstrap,
} from "@/lib/api";

import classes from "./route.module.css";

export const Route = createFileRoute("/app")({
  beforeLoad: async ({ context, location }) => {
    const cachedApp = getCachedAppBootstrap(context.queryClient);

    if (cachedApp?.session) {
      if (!isAppBootstrapFresh(context.queryClient)) {
        refreshAppBootstrapInBackground(context.queryClient);
      }

      return cachedApp;
    }

    const app = await context.queryClient.fetchQuery(getAppBootstrapQueryOptions());

    if (!app.session) {
      throw redirect({
        to: "/auth/login",
        search: {
          redirect: location.href,
        },
      });
    }

    return app;
  },
  component: RouteComponent,
});

function RouteComponent() {
  const app = Route.useRouteContext();
  const queryClient = useQueryClient();
  const { value: maintenanceMode } = useFlag("maintenance-mode", app.maintenance);

  const [opened, { toggle }] = useDisclosure();

  useEffect(() => {
    setCachedAppBootstrap(queryClient, app);
  }, [app, queryClient]);

  if (!app.session) {
    return null;
  }

  const isNonAdminDuringMaintenance = maintenanceMode && app.session.user.role !== "admin";

  return (
    <AppShell
      classNames={{
        root: classes.rootContainer,
        main: classes.mainContainer,
        footer: classes.footer,
      }}
      header={{ height: 60 }}
      navbar={{
        width: 300,
        breakpoint: "sm",
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group align="center" h="100%" justify="space-between" px="md" w="100%">
          <Group flex={1}>
            <Burger hiddenFrom="sm" onClick={toggle} opened={opened} size="sm" />
            <Logo />
          </Group>
          <Group>
            {/*<SystemsStatus />*/}
            <ServerTime />
          </Group>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar px="md">
        <Navbar session={app.session} toggle={toggle} />
      </AppShell.Navbar>
      <AppShell.Main>
        {isNonAdminDuringMaintenance ? <MaintenanceBlocked /> : <Outlet />}
      </AppShell.Main>
    </AppShell>
  );
}

function MaintenanceBlocked() {
  return (
    <PageLayout>
      <Heading title="System under maintenance" />
      <Alert
        status={{
          status: "warning",
          title: "App access is temporarily limited",
          message: "Your session is still active. Please check back after maintenance is complete.",
        }}
      />
    </PageLayout>
  );
}
