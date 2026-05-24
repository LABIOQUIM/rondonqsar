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

const fetchMgmtQsarSubmissionsServer = createServerFn({ method: "GET" })
  .inputValidator(paginationSchema)
  .handler(async ({ data }) =>
    apiRequest<AdminQsarSubmissions>("/qsar/admin", {
      params: {
        page: data.page,
        pageSize: data.pageSize,
      },
    }),
  );

export const fetchMgmtQsarSubmissions = async (pageSize: number, page: number) => {
  return fetchMgmtQsarSubmissionsServer({ data: { page, pageSize } });
};

export const getMgmtQsarSubmissions = (
  props: MRT_PaginationState = { pageIndex: 0, pageSize: 10 },
) =>
  queryOptions({
    queryKey: QUERY_KEYS.mgmtQsarSubmissions(props.pageSize, props.pageIndex),
    queryFn: () => fetchMgmtQsarSubmissions(props.pageSize, props.pageIndex),
    placeholderData: keepPreviousData,
  });
