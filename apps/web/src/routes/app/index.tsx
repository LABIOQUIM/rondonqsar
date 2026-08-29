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

import { Alert } from "@/components/Alert";
import { PageLayout } from "@/components/PageLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { TableDateCell } from "@/components/TableDateCell";
import { TableTextCell } from "@/components/TableTextCell";
import { authClient } from "@/lib/auth-client";
import { isAnonymousSession } from "@/lib/auth-session";
import { buildPageTitle } from "@/lib/seo";
import { getUserQsarSubmissions } from "@/queries/getUserQsarSubmissions";

import classes from "./index.module.css";

export const Route = createFileRoute("/app/")({
  head: () => ({
    meta: [{ title: buildPageTitle("My QSAR Submissions") }],
  }),
  component: RouteComponent,
});

function StatusCell({ cell }: { cell: MRT_Cell<QsarSubmissionSummary> }) {
  return <StatusBadge status={cell.getValue<QSAR_SUBMISSION_STATUS>()} />;
}

function RouteComponent() {
  const { data: session } = authClient.useSession();
  const [pagination, onPaginationChange] = useState<MRT_PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const { data, isLoading } = useQuery(getUserQsarSubmissions(pagination));

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
      <Link params={{ submissionId: row.original.id }} to="/app/$submissionId">
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

  return (
    <PageLayout title="My QSAR Submissions">
      {isAnonymousSession(session) && (
        <Alert
          mb="md"
          status={{
            status: "info",
            title: "This is a shared account",
            message:
              "Under anonymous access all your submissions will be visible to other anonymous users, prefer not submitting confidential works here, instead, log-out and create your own, private account for that.",
          }}
        />
      )}
      <MantineReactTable table={table} />
    </PageLayout>
  );
}
