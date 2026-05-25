import { z } from "zod";

import { getAPIClient } from "@/lib/api";

const sendBatchMailSchema = z.object({
  html: z.string(),
  subject: z.string(),
});

export async function sendBatchMail(input: z.infer<typeof sendBatchMailSchema>) {
  const data = sendBatchMailSchema.parse(input);
  const api = await getAPIClient();

  return api.post<{ queued: number }>("/mailer/batch", data).then((response) => response.data);
}
