import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

import { buildPageTitle } from "@/lib/seo";
import { getMgmtQsarSubmission } from "@/queries/getMgmtQsarSubmission";

import { QsarSubmissionDetailView } from "../../-components/QsarSubmissionDetailView";

export const Route = createFileRoute("/app/mgmt/qsar/$submissionId")({
  head: () => ({
    meta: [{ title: buildPageTitle("QSAR Submission") }],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { submissionId } = Route.useParams();
  const { data, error, isError, isLoading } = useQuery(getMgmtQsarSubmission(submissionId));

  return (
    <QsarSubmissionDetailView
      data={data}
      error={error}
      extraSummaryItems={[
        {
          label: "Username",
          value: data?.username ?? "—",
        },
        {
          label: "User ID",
          truncate: true,
          value: data?.userId ?? "—",
        },
      ]}
      heading="QSAR Submission"
      isError={isError}
      isLoading={isLoading}
    />
  );
}
