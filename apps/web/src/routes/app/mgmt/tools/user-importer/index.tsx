import { createFileRoute } from "@tanstack/react-router";

import { Heading } from "@/components/Heading";
import { PageLayout } from "@/components/PageLayout";

import { DropFileButton } from "./-components/DropFileButton";
import { ImportTable } from "./-components/ImportTable";
import { useUserImporter } from "./-components/Provider";

export const Route = createFileRoute("/app/mgmt/tools/user-importer/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { users } = useUserImporter();

  return (
    <PageLayout>
      <Heading title="User Importer" />

      {users.length > 0 ? <ImportTable /> : <DropFileButton />}
    </PageLayout>
  );
}
