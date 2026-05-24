import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { apiRequest } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/queryKeys";

const pendingStatuses: QSAR_SUBMISSION_STATUS[] = ["QUEUED", "PROCESSING"];

const fetchUserQsarSubmissionServer = createServerFn({ method: "GET" })
  .inputValidator(z.object({ submissionId: z.string() }))
  .handler(async ({ data }) =>
    apiRequest<QsarSubmissionDetails>(`/qsar/current-user/${data.submissionId}`),
  );

export const fetchUserQsarSubmission = async (submissionId: string) => {
  return fetchUserQsarSubmissionServer({ data: { submissionId } });
};

export const getUserQsarSubmission = (submissionId: string) =>
  queryOptions({
    queryKey: QUERY_KEYS.qsarSubmission(submissionId),
    queryFn: () => fetchUserQsarSubmission(submissionId),
    refetchInterval: (query) =>
      query.state.data && pendingStatuses.includes(query.state.data.status) ? 5000 : false,
  });
