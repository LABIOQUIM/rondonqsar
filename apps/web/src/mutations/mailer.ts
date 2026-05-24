import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { apiRequest } from "@/lib/api";

const sendBatchMailSchema = z.object({
  html: z.string(),
  subject: z.string(),
});

export const sendBatchMail = createServerFn({ method: "POST" })
  .inputValidator(sendBatchMailSchema)
  .handler(async ({ data }) =>
    apiRequest<{ queued: number }>("/mailer/batch", {
      body: data,
      method: "POST",
    }),
  );
