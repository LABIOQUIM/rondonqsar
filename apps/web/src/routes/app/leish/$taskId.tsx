import { Alert, Box, Group, Stack, Text, Title, Tooltip } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import dayjs from "dayjs";
import { MantineReactTable, useMantineReactTable } from "mantine-react-table-open";
import type React from "react";

import { Heading } from "@/components/Heading";
import { Loader } from "@/components/Loader";
import { PageLayout } from "@/components/PageLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { getUserLeishTask } from "@/queries/getUserLeishTask";
import { formatDecimal } from "@/utilities/number";

import classes from "./$taskId.module.css";

export const Route = createFileRoute("/app/leish/$taskId")({
  component: RouteComponent,
});

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  const date = dayjs(value);

  if (!date.isValid()) {
    return "—";
  }

  return date.format("YYYY-MM-DD HH:mm:ss");
}

function formatNumber(value: number) {
  return formatDecimal(value, { precision: 4 });
}

function SummaryItem({
  label,
  truncate,
  value,
}: {
  label: string;
  truncate?: boolean;
  value: React.ReactNode;
}) {
  return (
    <Box className={classes.summaryItem}>
      <Text className={classes.summaryLabel}>{label}</Text>
      <Text
        className={`${classes.summaryValue} ${truncate ? classes.summaryValueTruncated : ""}`}
        component="div"
      >
        {value ?? "—"}
      </Text>
    </Box>
  );
}

function RouteComponent() {
  const { taskId } = Route.useParams();
  const { data, error, isError, isLoading } = useQuery(getUserLeishTask(taskId));

  const table = useMantineReactTable({
    data: data?.results || [],
    enablePagination: true,
    enableTopToolbar: false,
    enableStickyHeader: true,
    layoutMode: "grid",
    mantinePaginationProps: {
      showRowsPerPage: false,
    },
    mantinePaperProps: {
      className: classes.paper,
    },
    mantineTableContainerProps: {
      className: classes.tableContainer,
    },
    mantineTableProps: {
      highlightOnHover: true,
    },
    mantineTableHeadProps: {
      className: classes.tableHead,
    },
    mantineTableHeadCellProps: {
      className: classes.tableHeadCell,
    },
    columns: [
      {
        accessorKey: "moleculeNumber",
        header: "Molecule",
      },
      {
        accessorKey: "descriptorA",
        header: "D237",
        Cell: ({ cell }) => formatNumber(cell.getValue<number>()),
      },
      {
        accessorKey: "descriptorB",
        header: "D215",
        Cell: ({ cell }) => formatNumber(cell.getValue<number>()),
      },
      {
        accessorKey: "descriptorC",
        header: "D466",
        Cell: ({ cell }) => formatNumber(cell.getValue<number>()),
      },
      {
        accessorKey: "descriptorD",
        header: "D590",
        Cell: ({ cell }) => formatNumber(cell.getValue<number>()),
      },
      {
        accessorKey: "pec50",
        header: "pEC50",
        Cell: ({ cell }) => formatNumber(cell.getValue<number>()),
      },
      {
        accessorKey: "ec50",
        header: "EC50",
        Cell: ({ cell }) => formatNumber(cell.getValue<number>()),
      },
    ],
  });

  if (isLoading) {
    return (
      <PageLayout className={classes.content}>
        <Heading title="LeishQSAR Submission" />
        <Loader />
      </PageLayout>
    );
  }

  if (isError || !data) {
    return (
      <PageLayout className={classes.content}>
        <Heading title="LeishQSAR Submission" />
        <Alert color="red" icon={<IconAlertCircle size={18} />} title="Unable to load submission">
          {error instanceof Error ? error.message : "The submission details could not be loaded."}
        </Alert>
      </PageLayout>
    );
  }

  const isCompleted = data.status === "COMPLETED";

  return (
    <PageLayout className={classes.content}>
      <Heading title="LeishQSAR Submission" />

      <section className={classes.summary}>
        <SummaryItem label="Status" value={<StatusBadge status={data.status} />} />
        <SummaryItem
          label="Input File"
          truncate
          value={
            <Tooltip label={data.originalName} openDelay={400} withArrow>
              <span>{data.originalName}</span>
            </Tooltip>
          }
        />
        <SummaryItem label="Job" value={data.jobId} />
        <SummaryItem label="Results" value={data.resultCount} />
        <SummaryItem label="Submitted" value={formatDate(data.createdAt)} />
        <SummaryItem label="Updated" value={formatDate(data.updatedAt)} />
        {data.errorMessage ? <SummaryItem label="Error" value={data.errorMessage} /> : null}
      </section>

      {isCompleted ? (
        <Stack className={classes.resultsSection} gap="xs">
          <Title order={4}>Results</Title>
          <MantineReactTable table={table} />
        </Stack>
      ) : (
        <Stack className={classes.statusPanel} gap="xs">
          <Group gap="xs">
            <Title order={4}>Current status</Title>
            <StatusBadge status={data.status} />
          </Group>
          <Text c="dimmed" size="sm">
            Last updated {formatDate(data.updatedAt)}.
          </Text>
          {data.errorMessage ? (
            <Text c="red" size="sm">
              {data.errorMessage}
            </Text>
          ) : null}
        </Stack>
      )}
    </PageLayout>
  );
}
