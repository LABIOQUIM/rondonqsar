import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";

import { apiRequest, type SerializableJson } from "@/lib/api";
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

const fetchFeatureFlagsServer = createServerFn({ method: "GET" }).handler(async () =>
  apiRequest<FeatureFlag[]>("/feature-flags"),
);

export const fetchFeatureFlags = async () => {
  return fetchFeatureFlagsServer();
};

export const getFeatureFlags = () =>
  queryOptions({
    queryKey: QUERY_KEYS.featureFlags(),
    queryFn: fetchFeatureFlags,
  });
