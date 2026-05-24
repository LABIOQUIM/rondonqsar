import { Box, Paper } from "@mantine/core";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import BRAND_LOGO from "@/assets/rondonqsar.svg";
import { getOptionalServerSession } from "@/lib/api";

import classes from "./route.module.css";

export const Route = createFileRoute("/auth")({
  beforeLoad: async () => {
    const session = await getOptionalServerSession();

    if (session) {
      throw redirect({
        to: "/app",
      });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <Box className={classes.container}>
      <Paper className={classes.innerContainer}>
        <img alt="RondonQSAR Logo" src={BRAND_LOGO} />

        <Outlet />
      </Paper>
    </Box>
  );
}
