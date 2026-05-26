import { Box, Paper } from "@mantine/core";
import { OpenFeature, useFlag } from "@openfeature/react-sdk";
import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import BRAND_LOGO from "@/assets/rondonqsar.svg";
import { authClient } from "@/lib/auth-client";
import { hasCompleteAuthSession, isAdminSession } from "@/lib/auth-session";

import classes from "./route.module.css";

export const Route = createFileRoute("/auth")({
  beforeLoad: async () => {
    const session = await authClient.getSession();
    const auth = session.data;

    if (!hasCompleteAuthSession(auth)) {
      return;
    }

    const maintenance = OpenFeature.getClient().getBooleanValue("maintenance-mode", false);

    if (maintenance && !isAdminSession(auth)) {
      await authClient.signOut().catch(() => undefined);
      return;
    }

    throw redirect({
      to: "/app",
      replace: true,
    });
  },
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate({ from: "/auth" });
  const { data, isPending } = authClient.useSession();
  const { value: maintenanceMode } = useFlag("maintenance-mode", false);

  useEffect(() => {
    if (isPending || !hasCompleteAuthSession(data)) {
      return;
    }

    if (maintenanceMode && !isAdminSession(data)) {
      void authClient.signOut().catch(() => undefined);
      return;
    }

    void navigate({ to: "/app", replace: true });
  }, [data, isPending, maintenanceMode, navigate]);

  return (
    <Box className={classes.container}>
      <Paper className={classes.innerContainer}>
        <img alt="RondonQSAR Logo" src={BRAND_LOGO} />

        <Outlet />
      </Paper>
    </Box>
  );
}
