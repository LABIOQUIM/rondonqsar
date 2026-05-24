import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { getServerSession } from "@/lib/api";

export const Route = createFileRoute("/app/mgmt")({
  beforeLoad: async ({ location }) => {
    const session = await getServerSession();

    if (session?.user.role !== "admin") {
      throw redirect({
        to: "/app",
        search: {
          redirect: location.href,
        },
      });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return <Outlet />;
}
