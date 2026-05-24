import { ActionIcon, Alert } from "@mantine/core";
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
import { buildPageTitle } from "@/lib/seo";
import { getMgmtQsarSubmissions } from "@/queries/getMgmtQsarSubmissions";

import classes from "../-components/adminTable.module.css";

export const Route = createFileRoute("/app/mgmt/qsar/")({
  head: () => ({
    meta: [{ title: buildPageTitle("QSAR Submissions") }],
  }),
  component: RouteComponent,
});

function StatusCell({ cell }: { cell: MRT_Cell<AdminQsarSubmissionSummary> }) {
  return <StatusBadge status={cell.getValue<QSAR_SUBMISSION_STATUS>()} />;
}

function RouteComponent() {
  const [pagination, onPaginationChange] = useState<MRT_PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const { data, error, isError, isLoading } = useQuery(getMgmtQsarSubmissions(pagination));

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
      <Link params={{ submissionId: row.original.id }} to="/app/mgmt/qsar/$submissionId">
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
        accessorKey: "username",
        header: "Username",
        Cell: TableTextCell,
      },
      {
        accessorKey: "status",
        header: "Status",
        Cell: StatusCell,
      },
      {
        accessorKey: "plasmoResultCount",
        header: "Plasmo Results",
      },
      {
        accessorKey: "leishResultCount",
        header: "Leish Results",
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

  if (isError) {
    return (
      <PageLayout>
        <Heading title="QSAR Submissions" />
        <Alert color="red" title="Unable to load submissions">
          {error instanceof Error ? error.message : "The admin QSAR submissions could not be loaded."}
        </Alert>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Heading title="QSAR Submissions" />
      <MantineReactTable table={table} />
    </PageLayout>
  );
}
