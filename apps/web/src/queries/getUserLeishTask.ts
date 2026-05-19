import { queryOptions } from "@tanstack/react-query";

import { getAPIClient } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/queryKeys";

const pendingStatuses: LEISH_TASK_STATUS[] = ["QUEUED", "PROCESSING"];

export const fetchUserLeishTask = async (taskId: string) => {
  const api = await getAPIClient();

  return api.get<LeishTaskDetails>(`/leish/current-user/${taskId}`).then((r) => r.data);
};

export const getUserLeishTask = (taskId: string) =>
  queryOptions({
    queryKey: QUERY_KEYS.leishTask(taskId),
    queryFn: () => fetchUserLeishTask(taskId),
    refetchInterval: (query) =>
      query.state.data && pendingStatuses.includes(query.state.data.status) ? 5000 : false,
  });
