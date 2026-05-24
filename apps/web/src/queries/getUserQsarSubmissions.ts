import type { MRT_PaginationState } from "mantine-react-table-open";

import { keepPreviousData, queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { apiRequest } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/queryKeys";

const paginationSchema = z.object({
  page: z.number(),
  pageSize: z.number(),
});

const fetchUserQsarSubmissionsServer = createServerFn({ method: "GET" })
  .inputValidator(paginationSchema)
  .handler(async ({ data }) =>
    apiRequest<UserQsarSubmissions>("/qsar/current-user", {
      params: {
        page: data.page,
        pageSize: data.pageSize,
      },
    }),
  );

export const fetchUserQsarSubmissions = async (pageSize: number, page: number) => {
  return fetchUserQsarSubmissionsServer({ data: { page, pageSize } });
};

export const getUserQsarSubmissions = (
  props: MRT_PaginationState = { pageIndex: 0, pageSize: 10 },
) =>
  queryOptions({
    queryKey: QUERY_KEYS.qsarSubmissions(props.pageSize, props.pageIndex),
    queryFn: () => fetchUserQsarSubmissions(props.pageSize, props.pageIndex),
    placeholderData: keepPreviousData,
  });
