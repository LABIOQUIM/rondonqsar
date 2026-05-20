import type { NavigateFn } from "@tanstack/react-router";

import { notifications } from "@mantine/notifications";
import { IconCheck } from "@tabler/icons-react";

import { getAPIClient } from "@/lib/api";

type SubmitQsarSubmissionValues = {
  file: File;
};

export async function submitQsarSubmission(
  values: SubmitQsarSubmissionValues,
  navigate: NavigateFn,
) {
  const data = new FormData();
  data.append("file", values.file);

  const api = await getAPIClient();
  const response = await api.post<QsarSubmitResponse>("/qsar/submit", data);

  notifications.show({
    title: "Added to queue",
    message: `Your QSAR submission has been queued as job ${response.data.jobId}.`,
    color: "green",
    icon: <IconCheck />,
    withBorder: true,
  });

  navigate({
    to: "/app/qsar/$submissionId",
    params: {
      submissionId: response.data.submissionId,
    },
  });
}
