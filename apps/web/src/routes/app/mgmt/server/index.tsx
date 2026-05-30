import { createFileRoute } from "@tanstack/react-router";

import { Alert, Loader } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconX } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { PageLayout } from "@/components/PageLayout";
import { requeueQsarSubmission } from "@/mutations/requeueQsarSubmission";
import {
  getQsarQueueDiagnostics,
  type QsarQueueDiagnosticsPagination,
} from "@/queries/getQsarQueueDiagnostics";
import { getSystemInfo } from "@/queries/getSystemInfo";

import { QueueSummary } from "./-components/QueueSummary";
import { JobStateTable, JobTable, type JobTableRecord } from "./-components/JobStateTable";
import { ServerMetrics } from "./-components/ServerMetrics";
import { getInitialQueuePagination, setQueuePagination } from "./-components/pagination";

import classes from "./server.module.css";

export const Route = createFileRoute("/app/mgmt/server/")({
  component: RouteComponent,
});


function notify(message: string, success: boolean) {
  notifications.show({
    message,
    color: success ? "green" : "red",
    icon: success ? <IconCheck /> : <IconX />,
    withBorder: true,
  });
}

function RouteComponent() {
  const queryClient = useQueryClient();
  const [waitingPagination, setWaitingPagination] = useState(getInitialQueuePagination);
  const [activePagination, setActivePagination] = useState(getInitialQueuePagination);
  const [failedPagination, setFailedPagination] = useState(getInitialQueuePagination);
  const [queuedPagination, setQueuedPagination] = useState(getInitialQueuePagination);
  const queuePagination = useMemo<QsarQueueDiagnosticsPagination>(
    () => ({
      waitingPage: waitingPagination.pageIndex,
      activePage: activePagination.pageIndex,
      failedPage: failedPagination.pageIndex,
      queuedPage: queuedPagination.pageIndex,
    }),
    [
      activePagination.pageIndex,
      failedPagination.pageIndex,
      queuedPagination.pageIndex,
      waitingPagination.pageIndex,
    ],
  );
  const systemInfo = useQuery(getSystemInfo());
  const queueDiagnostics = useQuery(getQsarQueueDiagnostics(queuePagination));

  const requeueMutation = useMutation({
    mutationFn: requeueQsarSubmission,
    onSuccess: (data) => {
      notify(`Submission requeued as job ${data.jobId}.`, true);
      void queryClient.invalidateQueries({ queryKey: ["qsar-queue-diagnostics"] });
      void queryClient.invalidateQueries({ queryKey: ["mgmt-qsar-submissions"] });
      void queryClient.invalidateQueries({ queryKey: ["mgmt-qsar-submission"] });
    },
    onError: (error) => {
      notify(error instanceof Error ? error.message : "Unable to requeue submission.", false);
    },
  });

  const queueData = queueDiagnostics.data;
  const queuedSubmissionJobs = useMemo<PaginatedRecords<JobTableRecord>>(
    () => ({
      records:
        queueData?.queuedSubmissions.records.map((submission) => ({
          attemptsMade: null,
          finishedAt: submission.updatedAt,
          id: submission.jobId,
          requeueSubmissionId: submission.id,
          startedAt: submission.createdAt,
          username: submission.username,
        })) ?? [],
      total: queueData?.queuedSubmissions.total ?? 0,
    }),
    [queueData?.queuedSubmissions],
  );

  return (
    <PageLayout title="Server">
      {(systemInfo.isError || queueDiagnostics.isError) && (
        <Alert color="red" title="Unable to load server diagnostics" variant="light">
          {systemInfo.error instanceof Error
            ? systemInfo.error.message
            : queueDiagnostics.error instanceof Error
              ? queueDiagnostics.error.message
              : "The server diagnostics request failed."}
        </Alert>
      )}

      {systemInfo.isLoading && queueDiagnostics.isLoading ? (
        <div className={classes.loading}>
          <Loader />
        </div>
      ) : (
        <>
          <ServerMetrics systemInfo={systemInfo.data} />
          <QueueSummary queueData={queueData} />

          <div className={classes.jobsGrid}>
            <JobStateTable
              isFetching={queueDiagnostics.isFetching}
              isLoading={queueDiagnostics.isLoading}
              jobs={queueData?.recentJobs.waiting ?? { records: [], total: 0 }}
              onPaginationChange={(updater) => setQueuePagination(setWaitingPagination, updater)}
              pagination={waitingPagination}
              title="Waiting Jobs"
            />
            <JobStateTable
              isFetching={queueDiagnostics.isFetching}
              isLoading={queueDiagnostics.isLoading}
              jobs={queueData?.recentJobs.active ?? { records: [], total: 0 }}
              onPaginationChange={(updater) => setQueuePagination(setActivePagination, updater)}
              pagination={activePagination}
              title="Active Jobs"
            />
            <JobStateTable
              isFetching={queueDiagnostics.isFetching}
              isLoading={queueDiagnostics.isLoading}
              jobs={queueData?.recentJobs.failed ?? { records: [], total: 0 }}
              onRequeue={(submissionId) => requeueMutation.mutate(submissionId)}
              onPaginationChange={(updater) => setQueuePagination(setFailedPagination, updater)}
              pagination={failedPagination}
              requeueingSubmissionId={requeueMutation.variables}
              title="Failed Jobs"
            />
            <JobTable
              data={queuedSubmissionJobs}
              emptyMessage="No queued submissions to show."
              isFetching={queueDiagnostics.isFetching}
              isLoading={queueDiagnostics.isLoading}
              onRequeue={(submissionId) => requeueMutation.mutate(submissionId)}
              onPaginationChange={(updater) => setQueuePagination(setQueuedPagination, updater)}
              pagination={queuedPagination}
              requeueingSubmissionId={requeueMutation.variables}
              title="Queued Submissions"
            />
          </div>
        </>
      )}
    </PageLayout>
  );
}
