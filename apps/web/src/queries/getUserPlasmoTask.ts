import { queryOptions } from "@tanstack/react-query";

import { getAPIClient } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/queryKeys";

const pendingStatuses: PLASMO_TASK_STATUS[] = ["QUEUED", "PROCESSING"];

export const fetchUserPlasmoTask = async (taskId: string) => {
  const api = await getAPIClient();

  return api.get<PlasmoTaskDetails>(`/plasmo/current-user/${taskId}`).then((r) => r.data);
};

export const getUserPlasmoTask = (taskId: string) =>
  queryOptions({
    queryKey: QUERY_KEYS.plasmoTask(taskId),
    queryFn: () => fetchUserPlasmoTask(taskId),
    refetchInterval: (query) =>
      query.state.data && pendingStatuses.includes(query.state.data.status) ? 5000 : false,
  });
