import { keepPreviousData, queryOptions } from "@tanstack/react-query";

import { getAPIClient } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/queryKeys";

export type QsarQueueDiagnosticsPagination = {
  waitingPage: number;
  activePage: number;
  failedPage: number;
  queuedPage: number;
};

const defaultPagination: QsarQueueDiagnosticsPagination = {
  waitingPage: 0,
  activePage: 0,
  failedPage: 0,
  queuedPage: 0,
};

export const fetchQsarQueueDiagnostics = async (
  pagination: QsarQueueDiagnosticsPagination = defaultPagination,
) => {
  const api = await getAPIClient();
  return api
    .get<QsarQueueDiagnostics>("/qsar/admin/queue", {
      params: pagination,
    })
    .then((response) => response.data);
};

export const getQsarQueueDiagnostics = (
  pagination: QsarQueueDiagnosticsPagination = defaultPagination,
) =>
  queryOptions({
    queryKey: QUERY_KEYS.qsarQueueDiagnostics(
      pagination.waitingPage,
      pagination.activePage,
      pagination.failedPage,
      pagination.queuedPage,
    ),
    queryFn: () => fetchQsarQueueDiagnostics(pagination),
    placeholderData: keepPreviousData,
    refetchInterval: 10_000,
  });
