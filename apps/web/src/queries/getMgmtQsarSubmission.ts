import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { apiRequest } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/queryKeys";

const pendingStatuses: QSAR_SUBMISSION_STATUS[] = ["QUEUED", "PROCESSING"];

const fetchMgmtQsarSubmissionServer = createServerFn({ method: "GET" })
  .inputValidator(z.object({ submissionId: z.string() }))
  .handler(async ({ data }) =>
    apiRequest<AdminQsarSubmissionDetails>(`/qsar/admin/${data.submissionId}`),
  );

export const fetchMgmtQsarSubmission = async (submissionId: string) => {
  return fetchMgmtQsarSubmissionServer({ data: { submissionId } });
};

export const getMgmtQsarSubmission = (submissionId: string) =>
  queryOptions({
    queryKey: QUERY_KEYS.mgmtQsarSubmission(submissionId),
    queryFn: () => fetchMgmtQsarSubmission(submissionId),
    refetchInterval: (query) =>
      query.state.data && pendingStatuses.includes(query.state.data.status) ? 5000 : false,
  });
