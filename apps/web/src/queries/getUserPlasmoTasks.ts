import type { MRT_PaginationState } from "mantine-react-table-open";

import { queryOptions } from "@tanstack/react-query";

import { getAPIClient } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/queryKeys";

export const fetchUserPlasmoTasks = async (pageSize: number, page: number) => {
  const api = await getAPIClient();

  return api
    .get<UserPlasmoTasks>("/plasmo/current-user", {
      params: {
        pageSize,
        page,
      },
    })
    .then((r) => r.data);
};

export const getUserPlasmoTasks = (
  props: MRT_PaginationState = { pageIndex: 0, pageSize: 10 },
) =>
  queryOptions({
    queryKey: QUERY_KEYS.plasmoTasks(props.pageSize, props.pageIndex),
    queryFn: () => fetchUserPlasmoTasks(props.pageSize, props.pageIndex),
  });
