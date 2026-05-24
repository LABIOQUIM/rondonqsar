import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { authRequest, type SerializableJson } from "@/lib/api";

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

const loginSchema = z.object({
  identifier: z.string(),
  password: z.string(),
});

const registerSchema = z.object({
  email: z.string(),
  name: z.string(),
  password: z.string(),
  username: z.string(),
});

const updateUserSchema = z.object({
  data: z.record(z.string(), jsonValueSchema),
  userId: z.string(),
});

const createUserSchema = z.object({
  data: z.record(z.string(), jsonValueSchema).optional(),
  email: z.string(),
  name: z.string(),
  password: z.string().optional(),
  role: z.string().optional(),
});

export const login = createServerFn({ method: "POST" })
  .inputValidator(loginSchema)
  .handler(async ({ data }) => {
    const isEmail = /\S+@\S+\.\S+/.test(data.identifier);
    const path = isEmail ? "/sign-in/email" : "/sign-in/username";
    const body = isEmail
      ? { email: data.identifier, password: data.password }
      : { username: data.identifier, password: data.password };

    await authRequest(path, {
      body,
      method: "POST",
    });
    return { ok: true };
  });

export const register = createServerFn({ method: "POST" })
  .inputValidator(registerSchema)
  .handler(async ({ data }) => {
    await authRequest("/sign-up/email", {
      body: {
        email: data.email,
        name: data.name,
        password: data.password,
        username: data.username,
      },
      method: "POST",
    });
    return { ok: true };
  });

export const updateUser = createServerFn({ method: "POST" })
  .inputValidator(updateUserSchema)
  .handler(async ({ data }) => {
    await authRequest("/admin/update-user", {
      body: {
        data: data.data,
        userId: data.userId,
      },
      method: "POST",
    });
    return { ok: true };
  });

export const createUser = createServerFn({ method: "POST" })
  .inputValidator(createUserSchema)
  .handler(async ({ data }) => {
    await authRequest("/admin/create-user", {
      body: data,
      method: "POST",
    });
    return { ok: true };
  });
