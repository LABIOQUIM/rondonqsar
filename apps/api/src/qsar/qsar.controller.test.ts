import { BadRequestException, UnauthorizedException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import { QsarController } from "./qsar.controller.js";
import { type QsarService } from "./qsar.service.js";

describe("QsarController", () => {
  const file = {
    filename: "input_uuid-123.sdf",
    path: "/files/owner/qsar/input_uuid-123.sdf",
    originalname: "molecule.sdf",
  } as Express.Multer.File;

  it("lists the current user's qsar submissions", async () => {
    const findCurrentUser = vi.fn().mockResolvedValue({ records: [], total: 0 });
    const controller = new QsarController({ findCurrentUser } as unknown as QsarService);

    await expect(
      controller.findCurrentUser("25", "2", { user: { id: "user-id" } } as any),
    ).resolves.toEqual({ records: [], total: 0 });

    expect(findCurrentUser).toHaveBeenCalledWith("user-id", {
      pageSize: 25,
      page: 2,
    });
  });

  it("rejects list requests without a session user", () => {
    const controller = new QsarController({} as QsarService);

    expect(() => controller.findCurrentUser(undefined, undefined, null as any)).toThrow(
      UnauthorizedException,
    );
  });

  it("finds the current user's qsar submission details", async () => {
    const findCurrentUserSubmission = vi.fn().mockResolvedValue({ id: "submission-1" });
    const controller = new QsarController({
      findCurrentUserSubmission,
    } as unknown as QsarService);

    await expect(
      controller.findCurrentUserSubmission("submission-1", { user: { id: "user-id" } } as any),
    ).resolves.toEqual({ id: "submission-1" });

    expect(findCurrentUserSubmission).toHaveBeenCalledWith("user-id", "submission-1");
  });

  it("submits uploaded files to the qsar service with the session user", async () => {
    const submit = vi.fn().mockResolvedValue({ submissionId: "submission-1" });
    const controller = new QsarController({ submit } as unknown as QsarService);

    await expect(
      controller.submit(file, {
        user: { id: "user-id", username: "owner" },
      } as any),
    ).resolves.toEqual({ submissionId: "submission-1" });

    expect(submit).toHaveBeenCalledWith(file, {
      id: "user-id",
      username: "owner",
    });
  });

  it("rejects requests without an uploaded file", () => {
    const controller = new QsarController({} as QsarService);

    expect(() => controller.submit(undefined, { user: { id: "user-id" } } as any)).toThrow(
      BadRequestException,
    );
  });

  it("rejects submit requests without a session user", () => {
    const controller = new QsarController({} as QsarService);

    expect(() => controller.submit(file, null as any)).toThrow(UnauthorizedException);
  });
});
