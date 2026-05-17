import type { NavigateFn } from "@tanstack/react-router";

import { notifications } from "@mantine/notifications";
import { IconCheck } from "@tabler/icons-react";

import type { SimulationFormValues } from "@/routes/app/submit/-components/schema";

import { getAPIClient } from "@/lib/api";

export async function submitSimulation(values: SimulationFormValues, navigate: NavigateFn) {
  const data = new FormData();
  data.append("file", values.file);
  data.append("forceField", values.forceField);
  data.append("waterModel", values.waterModel);
  data.append("boxType", values.boxType);
  data.append("boxDistance", String(values.boxDistance));

  const api = await getAPIClient();

  const response = await api.post<{ jobId: string; status: "queued" }>(
    `/${values.type}/submit`,
    data,
  );

  notifications.show({
    title: "Added to queue",
    message: `Your ${values.type} calculation has been queued as job ${response.data.jobId}.`,
    color: "green",
    icon: <IconCheck />,
    withBorder: true,
  });

  navigate({ to: "/app", search: { type: values.type, tab: "run" } });
}
