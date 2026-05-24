import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/mgmt/simulations")({
  beforeLoad: () => {
    throw redirect({ to: "/app/mgmt/qsar" });
  },
});
