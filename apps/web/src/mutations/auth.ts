import { z } from "zod";

import { authClient } from "@/lib/auth-client";
import { type SerializableJson } from "@/lib/api";

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
  role: z.enum(["admin", "user"]).optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;

export async function login(input: LoginInput) {
  const data = loginSchema.parse(input);
  const isEmail = /\S+@\S+\.\S+/.test(data.identifier);

  const result = isEmail
    ? await authClient.signIn.email({
        email: data.identifier,
        password: data.password,
      })
    : await authClient.signIn.username({
        username: data.identifier,
        password: data.password,
      });

  if (result.error) {
    throw new Error(result.error.message ?? "Unable to sign in.");
  }

  return { ok: true };
}

export async function register(input: RegisterInput) {
  const data = registerSchema.parse(input);

  const result = await authClient.signUp.email({
    email: data.email,
    name: data.name,
    password: data.password,
    username: data.username,
  });

  if (result.error) {
    throw new Error(result.error.message ?? "Unable to register.");
  }

  return { ok: true };
}

export async function updateUser(input: UpdateUserInput) {
  const data = updateUserSchema.parse(input);

  const result = await authClient.admin.updateUser({
    data: data.data,
    userId: data.userId,
  });

  if (result.error) {
    throw new Error(result.error.message ?? "Unable to update user.");
  }

  return { ok: true };
}

export async function createUser(input: CreateUserInput) {
  const data = createUserSchema.parse(input);

  const result = await authClient.admin.createUser({
    data: data.data,
    email: data.email,
    name: data.name,
    password: data.password,
    role: data.role,
  });

  if (result.error) {
    throw new Error(result.error.message ?? "Unable to create user.");
  }

  return { ok: true };
}
