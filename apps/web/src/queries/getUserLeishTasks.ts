import type { MRT_PaginationState } from "mantine-react-table-open";

import { queryOptions } from "@tanstack/react-query";

import { getAPIClient } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/queryKeys";

export const fetchUserLeishTasks = async (pageSize: number, page: number) => {
  const api = await getAPIClient();

  return api
    .get<UserLeishTasks>("/leish/current-user", {
      params: {
        pageSize,
        page,
      },
    })
    .then((r) => r.data);
};

export const getUserLeishTasks = (
  props: MRT_PaginationState = { pageIndex: 0, pageSize: 10 },
) =>
  queryOptions({
    queryKey: QUERY_KEYS.leishTasks(props.pageSize, props.pageIndex),
    queryFn: () => fetchUserLeishTasks(props.pageSize, props.pageIndex),
  });
