import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { buildPageTitle } from "@/lib/seo";
import { getUserQsarSubmission } from "@/queries/getUserQsarSubmission";

import { QsarSubmissionDetailView } from "./-components/QsarSubmissionDetailView";

export const Route = createFileRoute("/app/$submissionId")({
  head: () => ({
    meta: [{ title: buildPageTitle("QSAR Submission") }],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const { submissionId } = Route.useParams();
  const { data, error, isError, isLoading } = useQuery(getUserQsarSubmission(submissionId));

  return (
    <QsarSubmissionDetailView
      data={data}
      error={error}
      heading="QSAR Submission"
      isError={isError}
      isLoading={isLoading}
    />
  );
}
