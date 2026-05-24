import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { apiRequest, type SerializableJson } from "@/lib/api";

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

const createFeatureFlagServer = createServerFn({ method: "POST" })
  .inputValidator(createFeatureFlagSchema)
  .handler(async ({ data }) => {
    await apiRequest("/feature-flags", {
      body: data,
      method: "POST",
    });
    return { ok: true };
  });

const updateFeatureFlagServer = createServerFn({ method: "POST" })
  .inputValidator(updateFeatureFlagSchema)
  .handler(async ({ data }) => {
    await apiRequest(`/feature-flags/${data.key}`, {
      body: data.data,
      method: "PATCH",
    });
    return { ok: true };
  });

const deleteFeatureFlagServer = createServerFn({ method: "POST" })
  .inputValidator(deleteFeatureFlagSchema)
  .handler(async ({ data }) => {
    await apiRequest(`/feature-flags/${data.key}`, {
      method: "DELETE",
    });
    return { ok: true };
  });

export async function createFeatureFlag(data: CreateFeatureFlagInput) {
  return createFeatureFlagServer({ data });
}

export async function updateFeatureFlag(key: string, data: UpdateFeatureFlagInput) {
  return updateFeatureFlagServer({ data: { data, key } });
}

export async function deleteFeatureFlag(key: string) {
  return deleteFeatureFlagServer({ data: { key } });
}
