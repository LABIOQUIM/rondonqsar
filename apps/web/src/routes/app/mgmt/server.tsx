import { Alert, Badge, Button, Group, Loader, Progress, Text, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconRefresh, IconX } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import dayjs from "dayjs";
import {
  MantineReactTable,
  type MRT_ColumnDef,
  type MRT_PaginationState,
  useMantineReactTable,
} from "mantine-react-table-open";
import { type Dispatch, type SetStateAction, useMemo, useState } from "react";

import { Heading } from "@/components/Heading";
import { PageLayout } from "@/components/PageLayout";
import { requeueQsarSubmission } from "@/mutations/requeueQsarSubmission";
import {
  getQsarQueueDiagnostics,
  type QsarQueueDiagnosticsPagination,
} from "@/queries/getQsarQueueDiagnostics";
import { getSystemInfo } from "@/queries/getSystemInfo";

import classes from "./server.module.css";

export const Route = createFileRoute("/app/mgmt/server")({
  component: RouteComponent,
});

const queueCountKeys = ["waiting", "active", "completed", "failed", "delayed"] as const;
const QUEUE_TABLE_PAGE_SIZE = 5;

type PaginationSetter = Dispatch<SetStateAction<MRT_PaginationState>>;

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

function getInitialQueuePagination(): MRT_PaginationState {
  return {
    pageIndex: 0,
    pageSize: QUEUE_TABLE_PAGE_SIZE,
  };
}

function setQueuePagination(
  setPagination: PaginationSetter,
  updater: SetStateAction<MRT_PaginationState>,
) {
  setPagination((current) => {
    const next = typeof updater === "function" ? updater(current) : updater;

    return {
      ...next,
      pageSize: QUEUE_TABLE_PAGE_SIZE,
    };
  });
}

function RecentJobsTable({
  isFetching,
  isLoading,
  jobs,
  onRequeue,
  onPaginationChange,
  pagination,
  requeueingSubmissionId,
  title,
}: {
  isFetching: boolean;
  isLoading: boolean;
  jobs: PaginatedRecords<QsarQueueJobSummary>;
  onRequeue?: (submissionId: string) => void;
  onPaginationChange: PaginationSetter;
  pagination: MRT_PaginationState;
  requeueingSubmissionId?: string | undefined;
  title: string;
}) {
  const columns = useMemo<MRT_ColumnDef<QsarQueueJobSummary>[]>(() => {
    const tableColumns: MRT_ColumnDef<QsarQueueJobSummary>[] = [
      {
        accessorKey: "id",
        header: "Job",
        Cell: ({ cell }) => cell.getValue<string | undefined>() ?? "--",
      },
      {
        accessorKey: "submissionId",
        header: "Submission",
        Cell: ({ cell }) => cell.getValue<string | null>() ?? "--",
      },
      {
        accessorKey: "state",
        header: "State",
        Cell: ({ cell }) => {
          const state = cell.getValue<string>();

          return (
            <Badge color={state === "failed" ? "red" : "blue"} variant="light">
              {state}
            </Badge>
          );
        },
      },
      {
        accessorKey: "attemptsMade",
        header: "Attempts",
      },
      {
        accessorKey: "processedOn",
        header: "Started",
        Cell: ({ cell }) => formatDateTime(cell.getValue<number | undefined>()),
      },
      {
        accessorKey: "finishedOn",
        header: "Finished",
        Cell: ({ cell }) => formatDateTime(cell.getValue<number | undefined>()),
      },
    ];

    if (onRequeue) {
      tableColumns.push({
        id: "action",
        header: "Action",
        Cell: ({ row }) => (
          <Button
            disabled={!row.original.submissionId}
            leftSection={<IconRefresh size={14} />}
            loading={requeueingSubmissionId === row.original.submissionId}
            onClick={() => row.original.submissionId && onRequeue(row.original.submissionId)}
            size="xs"
            variant="light"
          >
            Requeue
          </Button>
        ),
      });
    }

    return tableColumns;
  }, [onRequeue, requeueingSubmissionId]);

  const table = useMantineReactTable({
    data: jobs.records,
    columns,
    enableColumnActions: false,
    enablePagination: true,
    enableSorting: false,
    enableStickyHeader: true,
    enableTopToolbar: false,
    layoutMode: "grid",
    manualPagination: true,
    mantinePaginationProps: {
      showRowsPerPage: false,
    },
    mantinePaperProps: {
      className: classes.mrtPaper,
    },
    mantineTableContainerProps: {
      className: classes.mrtTableContainer,
    },
    mantineTableProps: {
      highlightOnHover: true,
    },
    onPaginationChange,
    paginationDisplayMode: "default",
    rowCount: jobs.total,
    state: {
      isLoading,
      pagination,
      showProgressBars: isFetching,
    },
  });

  return (
    <section className={classes.section}>
      <Group justify="space-between">
        <Title order={4}>{title}</Title>
        <Badge variant="light">{jobs.total}</Badge>
      </Group>

      <MantineReactTable table={table} />
    </section>
  );
}

function QueuedSubmissionsTable({
  isFetching,
  isLoading,
  onRequeue,
  onPaginationChange,
  pagination,
  requeueingSubmissionId,
  submissions,
}: {
  isFetching: boolean;
  isLoading: boolean;
  onRequeue: (submissionId: string) => void;
  onPaginationChange: PaginationSetter;
  pagination: MRT_PaginationState;
  requeueingSubmissionId?: string | undefined;
  submissions: PaginatedRecords<QsarQueuedSubmissionDiagnostic>;
}) {
  const columns = useMemo<MRT_ColumnDef<QsarQueuedSubmissionDiagnostic>[]>(
    () => [
      {
        accessorKey: "id",
        header: "Submission",
      },
      {
        accessorKey: "originalName",
        header: "File",
      },
      {
        accessorKey: "jobId",
        header: "Job",
        Cell: ({ cell }) => cell.getValue<string | null>() ?? "--",
      },
      {
        accessorKey: "redisState",
        header: "Redis",
        Cell: ({ cell }) => {
          const redisState = cell.getValue<string | null>();

          return (
            <Badge color={redisState === "unknown" ? "red" : "blue"} variant="light">
              {redisState ?? "none"}
            </Badge>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: "Submitted",
        Cell: ({ cell }) => formatDateTime(cell.getValue<string>()),
      },
      {
        accessorKey: "errorMessage",
        header: "Error",
        Cell: ({ cell }) => cell.getValue<string | null>() ?? "--",
      },
      {
        id: "action",
        header: "Action",
        Cell: ({ row }) => (
          <Button
            leftSection={<IconRefresh size={14} />}
            loading={requeueingSubmissionId === row.original.id}
            onClick={() => onRequeue(row.original.id)}
            size="xs"
            variant="light"
          >
            Requeue
          </Button>
        ),
      },
    ],
    [onRequeue, requeueingSubmissionId],
  );

  const table = useMantineReactTable({
    data: submissions.records,
    columns,
    enableColumnActions: false,
    enablePagination: true,
    enableSorting: false,
    enableStickyHeader: true,
    enableTopToolbar: false,
    layoutMode: "grid",
    manualPagination: true,
    mantinePaginationProps: {
      showRowsPerPage: false,
    },
    mantinePaperProps: {
      className: classes.mrtPaper,
    },
    mantineTableContainerProps: {
      className: classes.mrtTableContainer,
    },
    mantineTableProps: {
      highlightOnHover: true,
    },
    onPaginationChange,
    paginationDisplayMode: "default",
    rowCount: submissions.total,
    state: {
      isLoading,
      pagination,
      showProgressBars: isFetching,
    },
  });

  return (
    <section className={classes.section}>
      <Group justify="space-between">
        <Title order={4}>Queued Submissions</Title>
        <Badge variant="light">{submissions.total}</Badge>
      </Group>

      <MantineReactTable table={table} />
    </section>
  );
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
            <RecentJobsTable
              isFetching={queueDiagnostics.isFetching}
              isLoading={queueDiagnostics.isLoading}
              jobs={queueData?.recentJobs.waiting ?? { records: [], total: 0 }}
              onPaginationChange={(updater) => setQueuePagination(setWaitingPagination, updater)}
              pagination={waitingPagination}
              title="Waiting Jobs"
            />
            <RecentJobsTable
              isFetching={queueDiagnostics.isFetching}
              isLoading={queueDiagnostics.isLoading}
              jobs={queueData?.recentJobs.active ?? { records: [], total: 0 }}
              onPaginationChange={(updater) => setQueuePagination(setActivePagination, updater)}
              pagination={activePagination}
              title="Active Jobs"
            />
            <RecentJobsTable
              isFetching={queueDiagnostics.isFetching}
              isLoading={queueDiagnostics.isLoading}
              jobs={queueData?.recentJobs.failed ?? { records: [], total: 0 }}
              onRequeue={(submissionId) => requeueMutation.mutate(submissionId)}
              onPaginationChange={(updater) => setQueuePagination(setFailedPagination, updater)}
              pagination={failedPagination}
              requeueingSubmissionId={requeueMutation.variables}
              title="Failed Jobs"
            />
          </div>

          <QueuedSubmissionsTable
            isFetching={queueDiagnostics.isFetching}
            isLoading={queueDiagnostics.isLoading}
            onRequeue={(submissionId) => requeueMutation.mutate(submissionId)}
            onPaginationChange={(updater) => setQueuePagination(setQueuedPagination, updater)}
            pagination={queuedPagination}
            requeueingSubmissionId={requeueMutation.variables}
            submissions={queueData?.queuedSubmissions ?? { records: [], total: 0 }}
          />
        </>
      )}
    </PageLayout>
  );
}
