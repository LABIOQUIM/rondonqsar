import type { MRT_PaginationState } from "mantine-react-table-open";

import { keepPreviousData, queryOptions } from "@tanstack/react-query";

import { getAPIClient } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/queryKeys";

export const fetchMgmtQsarSubmissions = async (pageSize: number, page: number) => {
  const api = await getAPIClient();
  return api
    .get<AdminQsarSubmissions>("/qsar/admin", {
      params: {
        page,
        pageSize,
      },
    })
    .then((response) => response.data);
};

export const getMgmtQsarSubmissions = (
  props: MRT_PaginationState = { pageIndex: 0, pageSize: 10 },
) =>
  queryOptions({
    queryKey: QUERY_KEYS.mgmtQsarSubmissions(props.pageSize, props.pageIndex),
    queryFn: () => fetchMgmtQsarSubmissions(props.pageSize, props.pageIndex),
    placeholderData: keepPreviousData,
  });
