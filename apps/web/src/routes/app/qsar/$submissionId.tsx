import { Alert, Badge, Box, Group, Stack, Tabs, Text, Title, Tooltip } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import dayjs from "dayjs";
import {
  MantineReactTable,
  MRT_TablePagination,
  type MRT_CellValue,
  type MRT_ColumnDef,
  type MRT_Column,
  type MRT_RowData,
  type MRT_TableInstance,
  useMantineReactTable,
} from "mantine-react-table-open";
import type React from "react";

import { Heading } from "@/components/Heading";
import { Loader } from "@/components/Loader";
import { PageLayout } from "@/components/PageLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { getUserQsarSubmission } from "@/queries/getUserQsarSubmission";

import classes from "./$submissionId.module.css";

export const Route = createFileRoute("/app/qsar/$submissionId")({
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

const MOLECULE_COLUMN_SIZE = 88;
const RESULT_COLUMN_MIN_SIZE = 116;
const NUMERIC_COLUMN_IDS = new Set([
  "moleculeNumber",
  "descriptorA",
  "descriptorB",
  "descriptorC",
  "descriptorD",
  "pec50",
  "ec50",
]);

function formatScientific(value: number) {
  return value.toExponential(4);
}

function getNumberCellClass(column: MRT_Column<any, MRT_CellValue>) {
  return NUMERIC_COLUMN_IDS.has(column.id) ? classes.numberCell : "";
}

function getNumberHeadCellClass(column: MRT_Column<any, MRT_CellValue>) {
  return NUMERIC_COLUMN_IDS.has(column.id)
    ? `${classes.tableHeadCell} ${classes.numberHeadCell}`
    : classes.tableHeadCell;
}

function moleculeColumn<TData extends { moleculeNumber: number }>(): MRT_ColumnDef<TData> {
  return {
    accessorKey: "moleculeNumber",
    header: "Nº",
    grow: false,
    maxSize: MOLECULE_COLUMN_SIZE,
    minSize: MOLECULE_COLUMN_SIZE,
    size: MOLECULE_COLUMN_SIZE,
    Cell: ({ cell }) => cell.getValue<number>(),
  };
}

function resultNumberColumn<TData extends Record<string, unknown>>(
  accessorKey: keyof TData & string,
  header: string,
): MRT_ColumnDef<TData> {
  return {
    accessorKey,
    header,
    grow: 1,
    minSize: RESULT_COLUMN_MIN_SIZE,
    Cell: ({ cell }) => formatScientific(cell.getValue<number>()),
  };
}

function ResultBottomToolbar<TData extends MRT_RowData>({
  table,
}: {
  table: MRT_TableInstance<TData>;
}) {
  const {
    pagination: { pageIndex = 0, pageSize = 10 },
  } = table.getState();
  const total = table.options.rowCount ?? table.getPrePaginationRowModel().rows.length;
  const start = total === 0 ? 0 : pageIndex * pageSize + 1;
  const end = Math.min((pageIndex + 1) * pageSize, total);

  return (
    <Box className={classes.bottomToolbar}>
      <Text className={classes.paginationRange} size="sm">
        {start.toLocaleString()} - {end.toLocaleString()} of {total.toLocaleString()}
      </Text>
      <MRT_TablePagination position="bottom" table={table} />
    </Box>
  );
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
  const { submissionId } = Route.useParams();
  const { data, error, isError, isLoading } = useQuery(getUserQsarSubmission(submissionId));

  const plasmoTable = useMantineReactTable({
    data: data?.plasmoResults || [],
    enablePagination: true,
    enableTopToolbar: false,
    enableStickyHeader: true,
    enableColumnActions: false,
    enableSorting: false,
    layoutMode: "grid",
    mantinePaginationProps: {
      showRowsPerPage: false,
    },
    paginationDisplayMode: "pages",
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
    mantineTableBodyCellProps: ({ column }) => ({
      className: getNumberCellClass(column),
    }),
    mantineTableHeadCellProps: ({ column }) => ({
      className: getNumberHeadCellClass(column),
    }),
    columns: [
      moleculeColumn<PlasmoResultRow>(),
      resultNumberColumn<PlasmoResultRow>("descriptorA", "D143"),
      resultNumberColumn<PlasmoResultRow>("descriptorB", "D312"),
      resultNumberColumn<PlasmoResultRow>("descriptorC", "D470"),
      resultNumberColumn<PlasmoResultRow>("pec50", "pEC50"),
      resultNumberColumn<PlasmoResultRow>("ec50", "EC50"),
    ],
    renderBottomToolbar: ({ table }) => <ResultBottomToolbar table={table} />,
  });

  const leishTable = useMantineReactTable({
    data: data?.leishResults || [],
    enablePagination: true,
    enableTopToolbar: false,
    enableStickyHeader: true,
    enableColumnActions: false,
    enableSorting: false,
    layoutMode: "grid",
    mantinePaginationProps: {
      showRowsPerPage: false,
    },
    paginationDisplayMode: "pages",
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
    mantineTableBodyCellProps: ({ column }) => ({
      className: getNumberCellClass(column),
    }),
    mantineTableHeadCellProps: ({ column }) => ({
      className: getNumberHeadCellClass(column),
    }),
    columns: [
      moleculeColumn<LeishResultRow>(),
      resultNumberColumn<LeishResultRow>("descriptorA", "D237"),
      resultNumberColumn<LeishResultRow>("descriptorB", "D215"),
      resultNumberColumn<LeishResultRow>("descriptorC", "D466"),
      resultNumberColumn<LeishResultRow>("descriptorD", "D590"),
      resultNumberColumn<LeishResultRow>("pec50", "pEC50"),
      resultNumberColumn<LeishResultRow>("ec50", "EC50"),
    ],
    renderBottomToolbar: ({ table }) => <ResultBottomToolbar table={table} />,
  });

  if (isLoading) {
    return (
      <PageLayout className={classes.content}>
        <Heading title="QSAR Submission" />
        <Loader />
      </PageLayout>
    );
  }

  if (isError || !data) {
    return (
      <PageLayout className={classes.content}>
        <Heading title="QSAR Submission" />
        <Alert color="red" icon={<IconAlertCircle size={18} />} title="Unable to load submission">
          {error instanceof Error ? error.message : "The submission details could not be loaded."}
        </Alert>
      </PageLayout>
    );
  }

  const isCompleted = data.status === "COMPLETED";

  return (
    <PageLayout className={classes.content}>
      <Heading title="QSAR Submission" />

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
        <SummaryItem label="Submitted" value={formatDate(data.createdAt)} />
        <SummaryItem label="Updated" value={formatDate(data.updatedAt)} />
        {data.errorMessage ? <SummaryItem label="Error" value={data.errorMessage} /> : null}
      </section>

      {isCompleted ? (
        <Stack className={classes.resultsSection} gap="xs">
          <Title order={4}>Results</Title>
          <Tabs className={classes.tabs} defaultValue="plasmo" keepMounted={false}>
            <Tabs.List>
              <Tabs.Tab value="plasmo">
                <Group gap="xs" wrap="nowrap">
                  <span>PlasmoQSAR</span>
                  <Badge size="sm" variant="light">
                    {data.plasmoResultCount}
                  </Badge>
                </Group>
              </Tabs.Tab>
              <Tabs.Tab value="leish">
                <Group gap="xs" wrap="nowrap">
                  <span>LeishQSAR</span>
                  <Badge size="sm" variant="light">
                    {data.leishResultCount}
                  </Badge>
                </Group>
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel className={classes.tabPanel} pt="sm" value="plasmo">
              <MantineReactTable table={plasmoTable} />
            </Tabs.Panel>
            <Tabs.Panel className={classes.tabPanel} pt="sm" value="leish">
              <MantineReactTable table={leishTable} />
            </Tabs.Panel>
          </Tabs>
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
