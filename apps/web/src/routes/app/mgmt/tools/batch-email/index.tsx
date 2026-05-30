import { createFileRoute } from "@tanstack/react-router";

import { PageLayout } from "@/components/PageLayout";

import { ComposePanel } from "./-components/ComposePanel";

export const Route = createFileRoute("/app/mgmt/tools/batch-email/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <PageLayout title="Batch Email">
      <ComposePanel />
    </PageLayout>
  );
}
