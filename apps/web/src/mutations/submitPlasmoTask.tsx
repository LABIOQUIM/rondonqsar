import type { NavigateFn } from "@tanstack/react-router";

import { notifications } from "@mantine/notifications";
import { IconCheck } from "@tabler/icons-react";

import { getAPIClient } from "@/lib/api";

type SubmitPlasmoTaskValues = {
  file: File;
};

export async function submitPlasmoTask(values: SubmitPlasmoTaskValues, navigate: NavigateFn) {
  const data = new FormData();
  data.append("file", values.file);

  const api = await getAPIClient();
  const response = await api.post<PlasmoSubmitResponse>("/plasmo/submit", data);

  notifications.show({
    title: "Added to queue",
    message: `Your PlasmoQSAR submission has been queued as job ${response.data.jobId}.`,
    color: "green",
    icon: <IconCheck />,
    withBorder: true,
  });

  navigate({
    to: "/app/plasmo/$taskId",
    params: {
      taskId: response.data.taskId,
    },
  });
}
