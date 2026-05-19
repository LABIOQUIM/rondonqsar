import { ActionIcon } from "@mantine/core";
import { IconEye } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  MantineReactTable,
  type MRT_Cell,
  type MRT_PaginationState,
  useMantineReactTable,
} from "mantine-react-table-open";
import { useState } from "react";

import { Heading } from "@/components/Heading";
import { PageLayout } from "@/components/PageLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { TableDateCell } from "@/components/TableDateCell";
import { TableTextCell } from "@/components/TableTextCell";
import { getUserLeishTasks } from "@/queries/getUserLeishTasks";

import classes from "./index.module.css";

export const Route = createFileRoute("/app/leish/")({
  component: RouteComponent,
});

function StatusCell({ cell }: { cell: MRT_Cell<LeishTaskSummary> }) {
  return <StatusBadge status={cell.getValue<LEISH_TASK_STATUS>()} />;
}

function RouteComponent() {
  const [pagination, onPaginationChange] = useState<MRT_PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const { data, isLoading } = useQuery(getUserLeishTasks(pagination));

  const table = useMantineReactTable({
    data: data?.records || [],
    enablePagination: true,
    enableTopToolbar: false,
    manualPagination: true,
    enableStickyHeader: true,
    enableRowActions: true,
    onPaginationChange,
    paginationDisplayMode: "default",
    state: { isLoading, pagination },
    rowCount: data?.total ?? 0,
    displayColumnDefOptions: {
      "mrt-row-actions": {
        size: 80,
      },
    },
    layoutMode: "grid",
    renderRowActions: ({ row }) => (
      <Link params={{ taskId: row.original.id }} to="/app/leish/$taskId">
        <ActionIcon aria-label="View submission" size="lg" variant="subtle">
          <IconEye size={18} />
        </ActionIcon>
      </Link>
    ),
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
        accessorKey: "originalName",
        header: "Input File",
        Cell: TableTextCell,
      },
      {
        accessorKey: "status",
        header: "Status",
        Cell: StatusCell,
      },
      {
        accessorKey: "resultCount",
        header: "Results",
      },
      {
        accessorKey: "jobId",
        header: "Job",
        Cell: TableTextCell,
      },
      {
        accessorKey: "errorMessage",
        header: "Error",
        Cell: TableTextCell,
      },
      {
        accessorKey: "createdAt",
        header: "Submitted",
        Cell: TableDateCell,
      },
      {
        accessorKey: "updatedAt",
        header: "Updated",
        Cell: TableDateCell,
      },
    ],
  });

  return (
    <PageLayout>
      <Heading title="My LeishQSAR Submissions" />
      <MantineReactTable table={table} />
    </PageLayout>
  );
}
