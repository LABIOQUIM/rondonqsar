import type { NavigateFn } from "@tanstack/react-router";

import { notifications } from "@mantine/notifications";
import { IconCheck } from "@tabler/icons-react";

import { getAPIClient } from "@/lib/api";

type SubmitLeishTaskValues = {
  file: File;
};

export async function submitLeishTask(values: SubmitLeishTaskValues, navigate: NavigateFn) {
  const data = new FormData();
  data.append("file", values.file);

  const api = await getAPIClient();
  const response = await api.post<LeishSubmitResponse>("/leish/submit", data);

  notifications.show({
    title: "Added to queue",
    message: `Your LeishQSAR submission has been queued as job ${response.data.jobId}.`,
    color: "green",
    icon: <IconCheck />,
    withBorder: true,
  });

  navigate({
    to: "/app/leish/$taskId",
    params: {
      taskId: response.data.taskId,
    },
  });
}
