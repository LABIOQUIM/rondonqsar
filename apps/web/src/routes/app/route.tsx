import { AppShell, Burger, Group } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useFlag } from "@openfeature/react-sdk";
import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect } from "react";

import { Logo } from "@/components/Logo";
import { Navbar } from "@/components/Navbar";
import { ServerTime } from "@/components/ServerTime";
import { getClientFeatureFlags, getServerSession, isEnabledFlag, signOut } from "@/lib/api";

import classes from "./route.module.css";

export const Route = createFileRoute("/app")({
  beforeLoad: async ({ location }) => {
    const [auth, flags] = await Promise.all([getServerSession(), getClientFeatureFlags()]);

    if (!auth) {
      throw redirect({
        to: "/auth/login",
        search: {
          redirect: location.href,
        },
      });
    }

    const maintenance = isEnabledFlag(flags, "maintenance-mode", true);

    if (maintenance && auth.user.role !== "admin") {
      throw redirect({ to: "/auth/login" });
    }
  },
  loader: () => getServerSession(),
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate({ from: "/app" });
  const data = Route.useLoaderData();
  const signOutFn = useServerFn(signOut);
  const { value: maintenanceMode } = useFlag("maintenance-mode", true);

  const isNonAdminDuringMaintenance = maintenanceMode && data?.user.role !== "admin";

  useEffect(() => {
    if (isNonAdminDuringMaintenance) {
      void signOutFn().then(() => navigate({ to: "/auth/login" }));
    }
  }, [isNonAdminDuringMaintenance, navigate, signOutFn]);

  const [opened, { toggle }] = useDisclosure();

  if (!data || isNonAdminDuringMaintenance) {
    return null;
  }

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
        <Navbar session={data} toggle={toggle} />
      </AppShell.Navbar>
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
