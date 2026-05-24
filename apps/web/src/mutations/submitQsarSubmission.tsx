import type { NavigateFn } from "@tanstack/react-router";

import { notifications } from "@mantine/notifications";
import { IconCheck } from "@tabler/icons-react";
import { createServerFn } from "@tanstack/react-start";

import { apiRequest } from "@/lib/api";

type SubmitQsarSubmissionValues = {
  file: File;
};

const submitQsarSubmissionServer = createServerFn({ method: "POST" })
  .inputValidator((data: FormData) => data)
  .handler(async ({ data }) =>
    apiRequest<QsarSubmitResponse>("/qsar/submit", {
      body: data,
      method: "POST",
    }),
  );

export async function submitQsarSubmission(
  values: SubmitQsarSubmissionValues,
  navigate: NavigateFn,
) {
  const data = new FormData();
  data.append("file", values.file);

  const response = await submitQsarSubmissionServer({ data });

  notifications.show({
    title: "Added to queue",
    message: `Your QSAR submission has been queued as job ${response.jobId}.`,
    color: "green",
    icon: <IconCheck />,
    withBorder: true,
  });

  navigate({
    to: "/app/$submissionId",
    params: {
      submissionId: response.submissionId,
    },
  });
}
