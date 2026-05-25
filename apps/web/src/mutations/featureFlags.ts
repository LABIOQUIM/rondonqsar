import { z } from "zod";

import { getAPIClient, type SerializableJson } from "@/lib/api";

const jsonValueSchema: z.ZodType<SerializableJson> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(z.string(), jsonValueSchema),
  ]),
);

export type CreateFeatureFlagInput = {
  key: string;
  type: "BOOLEAN" | "STRING" | "NUMBER";
  enabled: boolean;
  defaultVariant: string;
  variants: Record<string, SerializableJson>;
  description?: string;
};

export type UpdateFeatureFlagInput = {
  enabled?: boolean;
  defaultVariant?: string;
  variants?: Record<string, SerializableJson>;
  description?: string;
};

const createFeatureFlagSchema = z.object({
  defaultVariant: z.string(),
  description: z.string().optional(),
  enabled: z.boolean(),
  key: z.string(),
  type: z.enum(["BOOLEAN", "STRING", "NUMBER"]),
  variants: z.record(z.string(), jsonValueSchema),
});

const updateFeatureFlagSchema = z.object({
  data: z.object({
    defaultVariant: z.string().optional(),
    description: z.string().optional(),
    enabled: z.boolean().optional(),
    variants: z.record(z.string(), jsonValueSchema).optional(),
  }),
  key: z.string(),
});

const deleteFeatureFlagSchema = z.object({
  key: z.string(),
});

export async function createFeatureFlag(data: CreateFeatureFlagInput) {
  const input = createFeatureFlagSchema.parse(data);
  const api = await getAPIClient();

  await api.post("/feature-flags", input);

  return { ok: true };
}

export async function updateFeatureFlag(key: string, data: UpdateFeatureFlagInput) {
  const input = updateFeatureFlagSchema.parse({ data, key });
  const api = await getAPIClient();

  await api.patch(`/feature-flags/${input.key}`, input.data);

  return { ok: true };
}

export async function deleteFeatureFlag(key: string) {
  const input = deleteFeatureFlagSchema.parse({ key });
  const api = await getAPIClient();

  await api.delete(`/feature-flags/${input.key}`);

  return { ok: true };
}
