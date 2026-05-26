import {
  Alert,
  Badge,
  Button,
  Group,
  Loader,
  Progress,
  Table,
  Text,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconRefresh, IconX } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import dayjs from "dayjs";

import { Heading } from "@/components/Heading";
import { PageLayout } from "@/components/PageLayout";
import { QUERY_KEYS } from "@/lib/queryKeys";
import { requeueQsarSubmission } from "@/mutations/requeueQsarSubmission";
import { getQsarQueueDiagnostics } from "@/queries/getQsarQueueDiagnostics";
import { getSystemInfo } from "@/queries/getSystemInfo";

import classes from "./server.module.css";

export const Route = createFileRoute("/app/mgmt/server")({
  component: RouteComponent,
});

const queueCountKeys = ["waiting", "active", "completed", "failed", "delayed"] as const;

function formatBytes(value: number) {
  if (!Number.isFinite(value) || value <= 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  const scaled = value / 1024 ** index;

  return `${scaled.toFixed(scaled >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return "--";
  return `${value.toFixed(1)}%`;
}

function formatDateTime(value?: number | string | null) {
  if (!value) return "--";

  const date = dayjs(value);
  return date.isValid() ? date.format("YYYY-MM-DD HH:mm:ss") : "--";
}

function getUsagePercent(used: number, total: number) {
  if (!total) return 0;
  return Math.min(100, Math.max(0, (used / total) * 100));
}

function getQueueCount(data: QsarQueueDiagnostics | undefined, key: string) {
  return data?.counts[key] ?? 0;
}

function notify(message: string, success: boolean) {
  notifications.show({
    message,
    color: success ? "green" : "red",
    icon: success ? <IconCheck /> : <IconX />,
    withBorder: true,
  });
}

function MetricPanel({
  detail,
  label,
  progress,
  value,
}: {
  detail: string;
  label: string;
  progress?: number;
  value: string;
}) {
  return (
    <section className={classes.panel}>
      <Text c="dimmed" size="xs" tt="uppercase">
        {label}
      </Text>
      <Text className={classes.metricValue}>{value}</Text>
      <Text c="dimmed" size="xs">
        {detail}
      </Text>
      {typeof progress === "number" ? (
        <Progress
          aria-label={`${label} usage`}
          className={classes.progress}
          color={progress > 85 ? "red" : progress > 70 ? "yellow" : "green"}
          value={progress}
        />
      ) : null}
    </section>
  );
}

function QueueStateBadge({ paused }: { paused: boolean }) {
  return (
    <Badge color={paused ? "red" : "green"} variant="light">
      {paused ? "Paused" : "Running"}
    </Badge>
  );
}

function EmptyRows({ colSpan, label }: { colSpan: number; label: string }) {
  return (
    <Table.Tr>
      <Table.Td colSpan={colSpan}>
        <Text c="dimmed" py="sm" ta="center">
          {label}
        </Text>
      </Table.Td>
    </Table.Tr>
  );
}

function RecentJobsTable({
  jobs,
  onRequeue,
  requeueingSubmissionId,
  title,
}: {
  jobs: QsarQueueJobSummary[];
  onRequeue?: (submissionId: string) => void;
  requeueingSubmissionId?: string | undefined;
  title: string;
}) {
  return (
    <section className={classes.section}>
      <Group justify="space-between">
        <Title order={4}>{title}</Title>
        <Badge variant="light">{jobs.length}</Badge>
      </Group>

      <div className={classes.tableWrap}>
        <Table highlightOnHover stickyHeader>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Job</Table.Th>
              <Table.Th>Submission</Table.Th>
              <Table.Th>State</Table.Th>
              <Table.Th>Attempts</Table.Th>
              <Table.Th>Started</Table.Th>
              <Table.Th>Finished</Table.Th>
              {onRequeue ? <Table.Th>Action</Table.Th> : null}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {jobs.length === 0 ? (
              <EmptyRows colSpan={onRequeue ? 7 : 6} label="No jobs in this state." />
            ) : (
              jobs.map((job) => (
                <Table.Tr key={`${title}-${job.id ?? job.submissionId ?? job.timestamp}`}>
                  <Table.Td>{job.id ?? "--"}</Table.Td>
                  <Table.Td>{job.submissionId ?? "--"}</Table.Td>
                  <Table.Td>
                    <Badge color={job.state === "failed" ? "red" : "blue"} variant="light">
                      {job.state}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{job.attemptsMade}</Table.Td>
                  <Table.Td>{formatDateTime(job.processedOn)}</Table.Td>
                  <Table.Td>{formatDateTime(job.finishedOn)}</Table.Td>
                  {onRequeue ? (
                    <Table.Td>
                      <Button
                        disabled={!job.submissionId}
                        leftSection={<IconRefresh size={14} />}
                        loading={requeueingSubmissionId === job.submissionId}
                        onClick={() => job.submissionId && onRequeue(job.submissionId)}
                        size="xs"
                        variant="light"
                      >
                        Requeue
                      </Button>
                    </Table.Td>
                  ) : null}
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </div>
    </section>
  );
}

function QueuedSubmissionsTable({
  onRequeue,
  requeueingSubmissionId,
  submissions,
}: {
  onRequeue: (submissionId: string) => void;
  requeueingSubmissionId?: string | undefined;
  submissions: QsarQueuedSubmissionDiagnostic[];
}) {
  return (
    <section className={classes.section}>
      <Group justify="space-between">
        <Title order={4}>Queued Submissions</Title>
        <Badge variant="light">{submissions.length}</Badge>
      </Group>

      <div className={classes.tableWrap}>
        <Table highlightOnHover stickyHeader>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Submission</Table.Th>
              <Table.Th>File</Table.Th>
              <Table.Th>Job</Table.Th>
              <Table.Th>Redis</Table.Th>
              <Table.Th>Submitted</Table.Th>
              <Table.Th>Error</Table.Th>
              <Table.Th>Action</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {submissions.length === 0 ? (
              <EmptyRows colSpan={7} label="No queued database submissions." />
            ) : (
              submissions.map((submission) => (
                <Table.Tr key={submission.id}>
                  <Table.Td>{submission.id}</Table.Td>
                  <Table.Td>{submission.originalName}</Table.Td>
                  <Table.Td>{submission.jobId ?? "--"}</Table.Td>
                  <Table.Td>
                    <Badge color={submission.redisState === "unknown" ? "red" : "blue"} variant="light">
                      {submission.redisState ?? "none"}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{formatDateTime(submission.createdAt)}</Table.Td>
                  <Table.Td>{submission.errorMessage ?? "--"}</Table.Td>
                  <Table.Td>
                    <Button
                      leftSection={<IconRefresh size={14} />}
                      loading={requeueingSubmissionId === submission.id}
                      onClick={() => onRequeue(submission.id)}
                      size="xs"
                      variant="light"
                    >
                      Requeue
                    </Button>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
        </Table>
      </div>
    </section>
  );
}

function RouteComponent() {
  const queryClient = useQueryClient();
  const systemInfo = useQuery(getSystemInfo());
  const queueDiagnostics = useQuery(getQsarQueueDiagnostics());

  const requeueMutation = useMutation({
    mutationFn: requeueQsarSubmission,
    onSuccess: (data) => {
      notify(`Submission requeued as job ${data.jobId}.`, true);
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.qsarQueueDiagnostics() });
      void queryClient.invalidateQueries({ queryKey: ["mgmt-qsar-submissions"] });
      void queryClient.invalidateQueries({ queryKey: ["mgmt-qsar-submission"] });
    },
    onError: (error) => {
      notify(error instanceof Error ? error.message : "Unable to requeue submission.", false);
    },
  });

  const memUsage = systemInfo.data
    ? getUsagePercent(systemInfo.data.mem.used, systemInfo.data.mem.total)
    : 0;
  const fsUsage = systemInfo.data
    ? getUsagePercent(systemInfo.data.fs.used, systemInfo.data.fs.size)
    : 0;
  const queueData = queueDiagnostics.data;

  return (
    <PageLayout className={classes.page}>
      <Heading title="Server" />

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
          <div className={classes.metricsGrid}>
            <MetricPanel
              detail={`${systemInfo.data?.cpu.vendor ?? "--"} · ${systemInfo.data?.cpu.physicalCores ?? "--"} physical cores`}
              label="CPU"
              value={systemInfo.data?.cpu.brand ?? "--"}
            />
            <MetricPanel
              detail={`${formatBytes(systemInfo.data?.mem.used ?? 0)} of ${formatBytes(systemInfo.data?.mem.total ?? 0)}`}
              label="Memory"
              progress={memUsage}
              value={formatPercent(memUsage)}
            />
            <MetricPanel
              detail={`${formatPercent(systemInfo.data?.load.average ?? Number.NaN)} average`}
              label="Current Load"
              progress={Math.min(systemInfo.data?.load.current ?? 0, 100)}
              value={formatPercent(systemInfo.data?.load.current ?? Number.NaN)}
            />
            <MetricPanel
              detail={`${formatBytes(systemInfo.data?.fs.available ?? 0)} available`}
              label="Filesystem"
              progress={fsUsage}
              value={formatPercent(fsUsage)}
            />
          </div>

          <section className={classes.section}>
            <Group justify="space-between">
              <Title order={4}>QSAR Queue</Title>
              {queueData ? <QueueStateBadge paused={queueData.paused} /> : null}
            </Group>

            <div className={classes.queueGrid}>
              <MetricPanel
                detail="Registered Redis workers"
                label="Workers"
                value={String(queueData?.workerCount ?? "--")}
              />
              {queueCountKeys.map((key) => (
                <MetricPanel
                  detail="BullMQ job count"
                  key={key}
                  label={key}
                  value={String(getQueueCount(queueData, key))}
                />
              ))}
            </div>
          </section>

          <div className={classes.jobsGrid}>
            <RecentJobsTable jobs={queueData?.recentJobs.waiting ?? []} title="Waiting Jobs" />
            <RecentJobsTable jobs={queueData?.recentJobs.active ?? []} title="Active Jobs" />
            <RecentJobsTable
              jobs={queueData?.recentJobs.failed ?? []}
              onRequeue={(submissionId) => requeueMutation.mutate(submissionId)}
              requeueingSubmissionId={requeueMutation.variables}
              title="Failed Jobs"
            />
          </div>

          <QueuedSubmissionsTable
            onRequeue={(submissionId) => requeueMutation.mutate(submissionId)}
            requeueingSubmissionId={requeueMutation.variables}
            submissions={queueData?.queuedSubmissions ?? []}
          />
        </>
      )}
    </PageLayout>
  );
}
