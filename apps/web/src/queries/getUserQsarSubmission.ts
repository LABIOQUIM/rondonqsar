import { queryOptions } from "@tanstack/react-query";

import { getAPIClient } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/queryKeys";

const pendingStatuses: QSAR_SUBMISSION_STATUS[] = ["QUEUED", "PROCESSING"];

export const fetchUserQsarSubmission = async (submissionId: string) => {
  const api = await getAPIClient();

  return api
    .get<QsarSubmissionDetails>(`/qsar/current-user/${submissionId}`)
    .then((r) => r.data);
};

export const getUserQsarSubmission = (submissionId: string) =>
  queryOptions({
    queryKey: QUERY_KEYS.qsarSubmission(submissionId),
    queryFn: () => fetchUserQsarSubmission(submissionId),
    refetchInterval: (query) =>
      query.state.data && pendingStatuses.includes(query.state.data.status) ? 5000 : false,
  });
