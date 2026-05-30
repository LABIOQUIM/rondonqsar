import { ActionIcon, Badge, Code, Text } from "@mantine/core";
import { IconEdit, IconPlus, IconTrash } from "@tabler/icons-react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  MantineReactTable,
  type MRT_Cell,
  useMantineReactTable,
} from "mantine-react-table-open";

import { PageLayout } from "@/components/PageLayout";
import { ButtonLink } from "@/components/RouterComponents";
import { TableBooleanCell } from "@/components/TableBooleanCell";
import { TableDateCell } from "@/components/TableDateCell";
import { TableTextCell } from "@/components/TableTextCell";
import { getFeatureFlags, type FeatureFlag } from "@/queries/getFeatureFlags";

import { useFlagMutations } from "./-components/useFlagMutations";
import classes from "../-components/adminTable.module.css";

const FLAG_TYPE_COLORS: Record<FeatureFlag["type"], string> = {
  BOOLEAN: "teal",
  STRING: "blue",
  NUMBER: "orange",
};

export const Route = createFileRoute("/app/mgmt/feature-flags/")({
  component: RouteComponent,
});

function DescriptionCell({ cell }: { cell: MRT_Cell<FeatureFlag> }) {
  const value = cell.getValue<string | null>();

  if (!value) {
    return "—";
  }

  return (
    <Text lineClamp={2} size="sm">
      {value}
    </Text>
  );
}

function TypeCell({ cell }: { cell: MRT_Cell<FeatureFlag> }) {
  const value = cell.getValue<FeatureFlag["type"]>();

  return (
    <Badge color={FLAG_TYPE_COLORS[value]} size="sm" variant="light">
      {value}
    </Badge>
  );
}

function VariantValueCell({ cell }: { cell: MRT_Cell<FeatureFlag> }) {
  const value = cell.getValue<string>();

  return <Code>{value}</Code>;
}

function RouteComponent() {
  const { data = [], isLoading } = useQuery(getFeatureFlags());
  const { deleteMutation } = useFlagMutations();

  const table = useMantineReactTable({
    data,
    enablePagination: true,
    enableTopToolbar: false,
    enableStickyHeader: true,
    enableRowActions: true,
    paginationDisplayMode: "default",
    state: { isLoading },
    displayColumnDefOptions: {
      "mrt-row-actions": {
        size: 80,
      },
    },
    layoutMode: "grid",
    renderRowActions: ({ row }) => (
      <>
        <Link params={{ key: row.original.key }} to="/app/mgmt/feature-flags/$key">
          <ActionIcon aria-label="Edit feature flag" size="lg" variant="subtle">
            <IconEdit size={18} />
          </ActionIcon>
        </Link>
        <ActionIcon
          aria-label="Delete feature flag"
          color="red"
          loading={deleteMutation.isPending && deleteMutation.variables === row.original.key}
          onClick={() => deleteMutation.mutate(row.original.key)}
          size="lg"
          variant="subtle"
        >
          <IconTrash size={18} />
        </ActionIcon>
      </>
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
        accessorKey: "key",
        header: "Key",
        Cell: TableTextCell,
      },
      {
        accessorKey: "description",
        header: "Description",
        Cell: DescriptionCell,
      },
      {
        accessorKey: "type",
        header: "Type",
        Cell: TypeCell,
      },
      {
        accessorKey: "enabled",
        header: "Enabled",
        Cell: TableBooleanCell,
      },
      {
        accessorKey: "defaultVariant",
        header: "Default Variant",
        Cell: TableTextCell,
      },
      {
        accessorFn: (flag) => JSON.stringify(flag.variants?.[flag.defaultVariant]),
        header: "Default Value",
        Cell: VariantValueCell,
      },
      {
        accessorKey: "updatedAt",
        header: "Updated At",
        Cell: TableDateCell,
      },
      {
        accessorKey: "createdAt",
        header: "Created At",
        Cell: TableDateCell,
      },
    ],
  });

  return (
    <PageLayout
      rightElement={
        <ButtonLink
          leftSection={<IconPlus size={16} />}
          size="sm"
          to="/app/mgmt/feature-flags/new"
        >
          New Flag
        </ButtonLink>
      }
      title="Feature Flags"
    >
      <MantineReactTable table={table} />
    </PageLayout>
  );
}
