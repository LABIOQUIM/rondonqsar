import { queryOptions } from "@tanstack/react-query";

import { getAPIClient } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/queryKeys";

const pendingStatuses: QSAR_SUBMISSION_STATUS[] = ["QUEUED", "PROCESSING"];

export const fetchMgmtQsarSubmission = async (submissionId: string) => {
  const api = await getAPIClient();

  return api.get<AdminQsarSubmissionDetails>(`/qsar/admin/${submissionId}`).then((r) => r.data);
};

export const getMgmtQsarSubmission = (submissionId: string) =>
  queryOptions({
    queryKey: QUERY_KEYS.mgmtQsarSubmission(submissionId),
    queryFn: () => fetchMgmtQsarSubmission(submissionId),
    refetchInterval: (query) =>
      query.state.data && pendingStatuses.includes(query.state.data.status) ? 5000 : false,
  });
