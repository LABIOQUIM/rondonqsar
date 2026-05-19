import { BadRequestException, UnauthorizedException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import { createSession } from "../test-utils/session.js";
import { LeishController } from "./leish.controller.js";
import { type LeishService } from "./leish.service.js";

describe("LeishController", () => {
  const file = {
    filename: "input_uuid-123.sdf",
    path: "/files/owner/leish/input_uuid-123.sdf",
    originalname: "molecule.sdf",
  } as Express.Multer.File;

  it("lists the current user's leish tasks", async () => {
    const findCurrentUser = vi.fn().mockResolvedValue({ records: [], total: 0 });
    const controller = new LeishController({
      findCurrentUser,
    } as unknown as LeishService);
    const session = createSession({
      user: {
        id: "user-id",
      },
    });

    await expect(controller.findCurrentUser("25", "2", session as any)).resolves.toEqual({
      records: [],
      total: 0,
    });
    expect(findCurrentUser).toHaveBeenCalledWith("user-id", {
      pageSize: 25,
      page: 2,
    });
  });

  it("rejects listing requests without a session user", () => {
    const controller = new LeishController({} as LeishService);

    expect(() => controller.findCurrentUser("10", "0", null as any)).toThrow(
      UnauthorizedException,
    );
  });

  it("finds the current user's leish task details", async () => {
    const findCurrentUserTask = vi.fn().mockResolvedValue({ id: "task-1" });
    const controller = new LeishController({
      findCurrentUserTask,
    } as unknown as LeishService);
    const session = createSession({
      user: {
        id: "user-id",
      },
    });

    await expect(controller.findCurrentUserTask("task-1", session as any)).resolves.toEqual({
      id: "task-1",
    });
    expect(findCurrentUserTask).toHaveBeenCalledWith("user-id", "task-1");
  });

  it("rejects detail requests without a session user", () => {
    const controller = new LeishController({} as LeishService);

    expect(() => controller.findCurrentUserTask("task-1", null as any)).toThrow(
      UnauthorizedException,
    );
  });

  it("submits uploaded files to the leish service with the session user", async () => {
    const submit = vi.fn().mockResolvedValue({ jobId: "1" });
    const controller = new LeishController({
      submit,
    } as unknown as LeishService);
    const session = createSession({
      user: {
        id: "user-id",
        username: "owner",
      },
    });

    await expect(controller.submit(file, session as any)).resolves.toEqual({ jobId: "1" });
    expect(submit).toHaveBeenCalledWith(file, {
      id: "user-id",
      username: "owner",
    });
  });

  it("rejects requests without an uploaded file", () => {
    const controller = new LeishController({} as LeishService);

    expect(() => controller.submit(undefined, createSession() as any)).toThrow(BadRequestException);
  });

  it("rejects requests without a session user", () => {
    const controller = new LeishController({} as LeishService);

    expect(() => controller.submit(file, null as any)).toThrow(UnauthorizedException);
  });
});
