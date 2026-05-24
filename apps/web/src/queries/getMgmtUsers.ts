import type {
  MRT_ColumnFiltersState,
  MRT_PaginationState,
  MRT_SortingState,
} from "mantine-react-table-open";
import type { UserWithRole } from "better-auth/plugins";

import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { authRequest } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/queryKeys";

type Props = {
  pagination?: MRT_PaginationState | undefined;
  columnFilters?: MRT_ColumnFiltersState | undefined;
  sorting?: MRT_SortingState | undefined;
};

type MgmtUsersResponse = {
  users: UserWithRole[];
  total: number;
  limit?: number;
  offset?: number;
};

const getMgmtUsersSchema = z.object({
  filterField: z.string().optional(),
  filterOperator: z.string().optional(),
  filterValue: z.string().optional(),
  limit: z.number(),
  offset: z.number(),
  sortBy: z.string().optional(),
  sortDirection: z.enum(["asc", "desc"]).optional(),
});

const fetchMgmtUsersServer = createServerFn({ method: "GET" })
  .inputValidator(getMgmtUsersSchema)
  .handler(async ({ data }) =>
    authRequest<MgmtUsersResponse>("/admin/list-users", {
      params: data,
    }),
  );

export const fetchMgmtUsers = async ({ pagination, columnFilters, sorting }: Props) => {
  return fetchMgmtUsersServer({
    data: {
      filterField: columnFilters && columnFilters.length > 0 ? columnFilters[0].id : undefined,
      filterOperator: columnFilters && columnFilters.length > 0 ? "contains" : undefined,
      filterValue:
        columnFilters && columnFilters.length > 0 ? (columnFilters[0].value as string) : undefined,
      limit: pagination ? pagination.pageSize : 999999,
      offset: pagination ? pagination.pageIndex * pagination.pageSize : 0,
      sortBy: sorting && sorting.length > 0 ? sorting[0].id : undefined,
      sortDirection: sorting && sorting.length > 0 ? (sorting[0].desc ? "desc" : "asc") : undefined,
    },
  });
};

export const getMgmtUsers = ({ pagination, columnFilters, sorting }: Props) =>
  queryOptions({
    queryKey: QUERY_KEYS.mgmtUsers(pagination, columnFilters, sorting),
    queryFn: () => fetchMgmtUsers({ pagination, columnFilters, sorting }),
    placeholderData: keepPreviousData,
  });
