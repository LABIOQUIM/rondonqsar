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

  it("lists admin qsar submissions", async () => {
    const findAdmin = vi.fn().mockResolvedValue({ records: [], total: 0 });
    const controller = new QsarController({ findAdmin } as unknown as QsarService);

    await expect(controller.findAdmin("25", "2")).resolves.toEqual({ records: [], total: 0 });

    expect(findAdmin).toHaveBeenCalledWith({
      pageSize: 25,
      page: 2,
    });
  });

  it("finds admin qsar submission details", async () => {
    const findAdminSubmission = vi.fn().mockResolvedValue({ id: "submission-1" });
    const controller = new QsarController({
      findAdminSubmission,
    } as unknown as QsarService);

    await expect(controller.findAdminSubmission("submission-1")).resolves.toEqual({
      id: "submission-1",
    });

    expect(findAdminSubmission).toHaveBeenCalledWith("submission-1");
  });

  it("returns admin queue diagnostics", async () => {
    const getQueueDiagnostics = vi.fn().mockResolvedValue({ workerCount: 1 });
    const controller = new QsarController({
      getQueueDiagnostics,
    } as unknown as QsarService);

    await expect(controller.getQueueDiagnostics("2", "1", "3", "4")).resolves.toEqual({
      workerCount: 1,
    });

    expect(getQueueDiagnostics).toHaveBeenCalledWith({
      waitingPage: 2,
      activePage: 1,
      failedPage: 3,
      queuedPage: 4,
    });
  });

  it("requeues admin qsar submissions", async () => {
    const requeueAdminSubmission = vi.fn().mockResolvedValue({ jobId: "job-2" });
    const controller = new QsarController({
      requeueAdminSubmission,
    } as unknown as QsarService);

    await expect(controller.requeueAdminSubmission("submission-1")).resolves.toEqual({
      jobId: "job-2",
    });

    expect(requeueAdminSubmission).toHaveBeenCalledWith("submission-1");
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
