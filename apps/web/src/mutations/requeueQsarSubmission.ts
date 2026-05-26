import { z } from "zod";

import { getAPIClient } from "@/lib/api";

const requeueQsarSubmissionSchema = z.object({
  submissionId: z.string().min(1),
});

export async function requeueQsarSubmission(submissionId: string) {
  const input = requeueQsarSubmissionSchema.parse({ submissionId });
  const api = await getAPIClient();

  return api
    .post<QsarSubmitResponse>(`/qsar/admin/${input.submissionId}/requeue`, {})
    .then((response) => response.data);
}
