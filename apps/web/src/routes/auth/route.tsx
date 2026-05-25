import { Box, Paper } from "@mantine/core";
import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import BRAND_LOGO from "@/assets/rondonqsar.svg";
import { authClient } from "@/lib/auth-client";

import classes from "./route.module.css";

export const Route = createFileRoute("/auth")({
  beforeLoad: async () => {
    const session = await authClient.getSession();

    if (session.data) {
      throw redirect({
        to: "/app",
      });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate({ from: "/auth" });
  const { data } = authClient.useSession();

  useEffect(() => {
    if (data) {
      void navigate({ to: "/app" });
    }
  }, [data, navigate]);

  return (
    <Box className={classes.container}>
      <Paper className={classes.innerContainer}>
        <img alt="RondonQSAR Logo" src={BRAND_LOGO} />

        <Outlet />
      </Paper>
    </Box>
  );
}
