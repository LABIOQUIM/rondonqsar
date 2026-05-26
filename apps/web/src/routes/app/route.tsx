import { AppShell, Burger, Group } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { OpenFeature, useFlag } from "@openfeature/react-sdk";
import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { FirstLoadShell } from "@/components/FirstLoadShell";
import { Logo } from "@/components/Logo";
import { Navbar } from "@/components/Navbar";
import { ServerTime } from "@/components/ServerTime";
import { authClient } from "@/lib/auth-client";

import classes from "./route.module.css";

export const Route = createFileRoute("/app")({
  beforeLoad: async ({ location }) => {
    const session = await authClient.getSession();
    const auth = session.data;

    if (!auth?.session || !auth.user) {
      throw redirect({
        to: "/auth/login",
        search: {
          redirect: location.href,
        },
      });
    }

    const maintenance = OpenFeature.getClient().getBooleanValue("maintenance-mode", false);

    if (maintenance && auth.user.role !== "admin") {
      throw redirect({ to: "/auth/login" });
    }
  },
  pendingComponent: FirstLoadShell,
  pendingMs: 0,
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate({ from: "/app" });
  const { data, isPending } = authClient.useSession();
  const { value: maintenanceMode } = useFlag("maintenance-mode", false);

  const [opened, { toggle }] = useDisclosure();
  const hasCompleteSession = Boolean(data?.session && data.user);
  const isNonAdminDuringMaintenance = maintenanceMode && data?.user?.role !== "admin";

  useEffect(() => {
    if (isPending) return;

    if (!hasCompleteSession) {
      void navigate({ to: "/auth/login" });
      return;
    }

    if (isNonAdminDuringMaintenance) {
      void authClient.signOut().then(() => navigate({ to: "/auth/login" }));
    }
  }, [hasCompleteSession, isNonAdminDuringMaintenance, isPending, navigate]);

  if (isPending || !hasCompleteSession || isNonAdminDuringMaintenance) {
    return <FirstLoadShell />;
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
        <Navbar toggle={toggle} />
      </AppShell.Navbar>
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
