import { BadRequestException, UnauthorizedException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import { createSession } from "../test-utils/session.js";
import { PlasmoController } from "./plasmo.controller.js";
import { type PlasmoService } from "./plasmo.service.js";

describe("PlasmoController", () => {
  const file = {
    filename: "input_uuid-123.sdf",
    path: "/files/owner/plasmo/input_uuid-123.sdf",
    originalname: "molecule.sdf",
  } as Express.Multer.File;

  it("lists the current user's plasmo tasks", async () => {
    const findCurrentUser = vi.fn().mockResolvedValue({ records: [], total: 0 });
    const controller = new PlasmoController({
      findCurrentUser,
    } as unknown as PlasmoService);
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
    const controller = new PlasmoController({} as PlasmoService);

    expect(() => controller.findCurrentUser("10", "0", null as any)).toThrow(
      UnauthorizedException,
    );
  });

  it("finds the current user's plasmo task details", async () => {
    const findCurrentUserTask = vi.fn().mockResolvedValue({ id: "task-1" });
    const controller = new PlasmoController({
      findCurrentUserTask,
    } as unknown as PlasmoService);
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
    const controller = new PlasmoController({} as PlasmoService);

    expect(() => controller.findCurrentUserTask("task-1", null as any)).toThrow(
      UnauthorizedException,
    );
  });

  it("submits uploaded files to the plasmo service with the session user", async () => {
    const submit = vi.fn().mockResolvedValue({ jobId: "1" });
    const controller = new PlasmoController({
      submit,
    } as unknown as PlasmoService);
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
    const controller = new PlasmoController({} as PlasmoService);

    expect(() => controller.submit(undefined, createSession() as any)).toThrow(BadRequestException);
  });

  it("rejects requests without a session user", () => {
    const controller = new PlasmoController({} as PlasmoService);

    expect(() => controller.submit(file, null as any)).toThrow(UnauthorizedException);
  });
});
