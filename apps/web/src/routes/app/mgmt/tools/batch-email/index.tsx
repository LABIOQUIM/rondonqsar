import { createFileRoute } from "@tanstack/react-router";

import { Heading } from "@/components/Heading";
import { PageLayout } from "@/components/PageLayout";

import { ComposePanel } from "./-components/ComposePanel";

export const Route = createFileRoute("/app/mgmt/tools/batch-email/")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <PageLayout>
      <Heading title="Batch Email" />
      <ComposePanel />
    </PageLayout>
  );
}
