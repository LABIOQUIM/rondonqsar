import { Box, Paper } from "@mantine/core";
import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";

import BRAND_LOGO from "@/assets/rondonqsar.svg";
import { authClient } from "@/lib/auth-client";

import classes from "./route.module.css";

export const Route = createFileRoute("/auth")({
  ssr: false,
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

  if (data) {
    navigate({ to: "/app" });

    return (
      <Box className={classes.container}>
        <Paper className={classes.innerContainer}>
          <img alt="RondonQSAR Logo" src={BRAND_LOGO} />
        </Paper>
      </Box>
    );
  }

  return (
    <Box className={classes.container}>
      <Paper className={classes.innerContainer}>
        <img alt="RondonQSAR Logo" src={BRAND_LOGO} />

        <Outlet />
      </Paper>
    </Box>
  );
}
