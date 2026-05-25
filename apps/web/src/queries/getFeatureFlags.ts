import { queryOptions } from "@tanstack/react-query";

import { getAPIClient, type SerializableJson } from "@/lib/api";
import { QUERY_KEYS } from "@/lib/queryKeys";

export type FeatureFlag = {
  id: string;
  key: string;
  type: "BOOLEAN" | "STRING" | "NUMBER";
  enabled: boolean;
  defaultVariant: string;
  variants: Record<string, SerializableJson>;
  description: string | null;
  createdAt: string;
  updatedAt: string | null;
};

export const fetchFeatureFlags = async () => {
  const api = await getAPIClient();
  return api.get<FeatureFlag[]>("/feature-flags").then((response) => response.data);
};

export const getFeatureFlags = () =>
  queryOptions({
    queryKey: QUERY_KEYS.featureFlags(),
    queryFn: fetchFeatureFlags,
  });
