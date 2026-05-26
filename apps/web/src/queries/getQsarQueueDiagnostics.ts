import { queryOptions } from "@tanstack/react-query";

import { getAPIClient } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/queryKeys";

export const fetchQsarQueueDiagnostics = async () => {
  const api = await getAPIClient();
  return api.get<QsarQueueDiagnostics>("/qsar/admin/queue").then((response) => response.data);
};

export const getQsarQueueDiagnostics = () =>
  queryOptions({
    queryKey: QUERY_KEYS.qsarQueueDiagnostics(),
    queryFn: fetchQsarQueueDiagnostics,
    refetchInterval: 10_000,
  });
