import { NotFoundException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { QsarService } from "./qsar.service.js";

const { existsSync, mkdirSync, renameSync } = vi.hoisted(() => ({
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
  renameSync: vi.fn(),
}));

vi.mock("fs", () => ({
  default: {
    existsSync,
    mkdirSync,
    renameSync,
  },
  existsSync,
  mkdirSync,
  renameSync,
}));

describe("QsarService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("lists the current user's qsar submissions with pagination and result counts", async () => {
    const queue = {
      add: vi.fn(),
    };
    const prisma = {
      qsarSubmission: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "submission-1",
            originalName: "molecule.sdf",
            status: "COMPLETED",
            jobId: "job-1",
            errorMessage: null,
            createdAt: new Date("2026-05-17T00:00:00.000Z"),
            updatedAt: null,
            _count: {
              plasmoResults: 3,
              leishResults: 4,
            },
          },
        ]),
        count: vi.fn().mockResolvedValue(1),
      },
    };
    const service = new QsarService(queue as any, prisma as any);

    await expect(service.findCurrentUser("user-id", { page: 2, pageSize: 25 })).resolves.toEqual({
      records: [
        {
          id: "submission-1",
          originalName: "molecule.sdf",
          status: "COMPLETED",
          jobId: "job-1",
          errorMessage: null,
          createdAt: new Date("2026-05-17T00:00:00.000Z"),
          updatedAt: null,
          plasmoResultCount: 3,
          leishResultCount: 4,
        },
      ],
      total: 1,
    });

    expect(prisma.qsarSubmission.findMany).toHaveBeenCalledWith({
      where: { userId: "user-id" },
      orderBy: { createdAt: "desc" },
      skip: 50,
      take: 25,
      select: {
        id: true,
        originalName: true,
        status: true,
        jobId: true,
        errorMessage: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            plasmoResults: true,
            leishResults: true,
          },
        },
      },
    });
    expect(prisma.qsarSubmission.count).toHaveBeenCalledWith({
      where: { userId: "user-id" },
    });
  });

  it("finds a current user's qsar submission details with sorted result tabs", async () => {
    const queue = {
      add: vi.fn(),
    };
    const prisma = {
      qsarSubmission: {
        findFirst: vi.fn().mockResolvedValue({
          id: "submission-1",
          originalName: "molecule.sdf",
          status: "COMPLETED",
          jobId: "job-1",
          errorMessage: null,
          createdAt: new Date("2026-05-17T00:00:00.000Z"),
          updatedAt: null,
          plasmoResults: [{ moleculeNumber: 1, descriptorA: 1, descriptorB: 2, descriptorC: 3 }],
          leishResults: [
            { moleculeNumber: 1, descriptorA: 1, descriptorB: 2, descriptorC: 3, descriptorD: 4 },
          ],
          _count: {
            plasmoResults: 1,
            leishResults: 1,
          },
        }),
      },
    };
    const service = new QsarService(queue as any, prisma as any);

    await expect(service.findCurrentUserSubmission("user-id", "submission-1")).resolves.toEqual({
      id: "submission-1",
      originalName: "molecule.sdf",
      status: "COMPLETED",
      jobId: "job-1",
      errorMessage: null,
      createdAt: new Date("2026-05-17T00:00:00.000Z"),
      updatedAt: null,
      plasmoResults: [{ moleculeNumber: 1, descriptorA: 1, descriptorB: 2, descriptorC: 3 }],
      leishResults: [
        { moleculeNumber: 1, descriptorA: 1, descriptorB: 2, descriptorC: 3, descriptorD: 4 },
      ],
      plasmoResultCount: 1,
      leishResultCount: 1,
    });

    expect(prisma.qsarSubmission.findFirst).toHaveBeenCalledWith({
      where: {
        id: "submission-1",
        userId: "user-id",
      },
      select: expect.objectContaining({
        plasmoResults: expect.objectContaining({
          orderBy: {
            moleculeNumber: "asc",
          },
        }),
        leishResults: expect.objectContaining({
          orderBy: {
            moleculeNumber: "asc",
          },
        }),
      }),
    });
  });

  it("lists every qsar submission for admins with owner metadata", async () => {
    const queue = {
      add: vi.fn(),
    };
    const prisma = {
      qsarSubmission: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "submission-1",
            userId: "user-1",
            originalName: "molecule.sdf",
            status: "COMPLETED",
            jobId: "job-1",
            errorMessage: null,
            createdAt: new Date("2026-05-17T00:00:00.000Z"),
            updatedAt: null,
            user: {
              username: "owner",
            },
            _count: {
              plasmoResults: 3,
              leishResults: 4,
            },
          },
        ]),
        count: vi.fn().mockResolvedValue(1),
      },
    };
    const service = new QsarService(queue as any, prisma as any);

    await expect(service.findAdmin({ page: 2, pageSize: 25 })).resolves.toEqual({
      records: [
        {
          id: "submission-1",
          userId: "user-1",
          username: "owner",
          originalName: "molecule.sdf",
          status: "COMPLETED",
          jobId: "job-1",
          errorMessage: null,
          createdAt: new Date("2026-05-17T00:00:00.000Z"),
          updatedAt: null,
          plasmoResultCount: 3,
          leishResultCount: 4,
        },
      ],
      total: 1,
    });

    expect(prisma.qsarSubmission.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: "desc" },
      skip: 50,
      take: 25,
      select: {
        id: true,
        userId: true,
        originalName: true,
        status: true,
        jobId: true,
        errorMessage: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            username: true,
          },
        },
        _count: {
          select: {
            plasmoResults: true,
            leishResults: true,
          },
        },
      },
    });
    expect(prisma.qsarSubmission.count).toHaveBeenCalledWith();
  });

  it("finds admin qsar submission details with owner metadata", async () => {
    const queue = {
      add: vi.fn(),
    };
    const prisma = {
      qsarSubmission: {
        findFirst: vi.fn().mockResolvedValue({
          id: "submission-1",
          userId: "user-1",
          originalName: "molecule.sdf",
          status: "COMPLETED",
          jobId: "job-1",
          errorMessage: null,
          createdAt: new Date("2026-05-17T00:00:00.000Z"),
          updatedAt: null,
          user: {
            username: "owner",
          },
          plasmoResults: [{ moleculeNumber: 1, descriptorA: 1, descriptorB: 2, descriptorC: 3 }],
          leishResults: [
            { moleculeNumber: 1, descriptorA: 1, descriptorB: 2, descriptorC: 3, descriptorD: 4 },
          ],
          _count: {
            plasmoResults: 1,
            leishResults: 1,
          },
        }),
      },
    };
    const service = new QsarService(queue as any, prisma as any);

    await expect(service.findAdminSubmission("submission-1")).resolves.toEqual({
      id: "submission-1",
      userId: "user-1",
      username: "owner",
      originalName: "molecule.sdf",
      status: "COMPLETED",
      jobId: "job-1",
      errorMessage: null,
      createdAt: new Date("2026-05-17T00:00:00.000Z"),
      updatedAt: null,
      plasmoResults: [{ moleculeNumber: 1, descriptorA: 1, descriptorB: 2, descriptorC: 3 }],
      leishResults: [
        { moleculeNumber: 1, descriptorA: 1, descriptorB: 2, descriptorC: 3, descriptorD: 4 },
      ],
      plasmoResultCount: 1,
      leishResultCount: 1,
    });

    expect(prisma.qsarSubmission.findFirst).toHaveBeenCalledWith({
      where: {
        id: "submission-1",
      },
      select: expect.objectContaining({
        userId: true,
        user: {
          select: {
            username: true,
          },
        },
        plasmoResults: expect.objectContaining({
          orderBy: {
            moleculeNumber: "asc",
          },
        }),
        leishResults: expect.objectContaining({
          orderBy: {
            moleculeNumber: "asc",
          },
        }),
      }),
    });
  });

  it("throws not found when the admin qsar submission does not exist", async () => {
    const queue = {
      add: vi.fn(),
    };
    const prisma = {
      qsarSubmission: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    };
    const service = new QsarService(queue as any, prisma as any);

    await expect(service.findAdminSubmission("submission-1")).rejects.toThrow(NotFoundException);
  });

  it("throws not found when the current user's qsar submission does not exist", async () => {
    const queue = {
      add: vi.fn(),
    };
    const prisma = {
      qsarSubmission: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    };
    const service = new QsarService(queue as any, prisma as any);

    await expect(service.findCurrentUserSubmission("user-id", "submission-1")).rejects.toThrow(
      NotFoundException,
    );
  });

  it("creates a submission, moves the file, and enqueues unified qsar calculation jobs", async () => {
    const queue = {
      add: vi.fn().mockResolvedValue({ id: "job-1" }),
    };
    const prisma = {
      qsarSubmission: {
        create: vi.fn().mockResolvedValue({ id: "submission-1" }),
        update: vi.fn().mockResolvedValue({ id: "submission-1" }),
      },
    };
    const service = new QsarService(queue as any, prisma as any);
    const file = {
      filename: "input_uuid-123.sdf",
      path: "/files/owner/qsar/input_uuid-123.sdf",
      originalname: "molecule.sdf",
    } as Express.Multer.File;
    const user = {
      id: "user-id",
      username: "owner",
    };

    await expect(service.submit(file, user)).resolves.toEqual({
      calculation: "qsar",
      submissionId: "submission-1",
      jobId: "job-1",
      status: "queued",
      file: {
        filename: "input_uuid-123.sdf",
        path: "/files/owner/qsar/submission-1/input_uuid-123.sdf",
        originalName: "molecule.sdf",
      },
    });

    expect(prisma.qsarSubmission.create).toHaveBeenCalledWith({
      data: {
        userId: "user-id",
        originalName: "molecule.sdf",
        filename: "input_uuid-123.sdf",
        filePath: "/files/owner/qsar/input_uuid-123.sdf",
        status: "QUEUED",
      },
    });
    expect(mkdirSync).toHaveBeenCalledWith("/files/owner/qsar/submission-1", {
      recursive: true,
    });
    expect(renameSync).toHaveBeenCalledWith(
      "/files/owner/qsar/input_uuid-123.sdf",
      "/files/owner/qsar/submission-1/input_uuid-123.sdf",
    );
    expect(queue.add).toHaveBeenCalledWith(
      "calculate-qsar",
      expect.objectContaining({
        calculation: "qsar",
        submissionId: "submission-1",
        file: {
          filename: "input_uuid-123.sdf",
          path: "/files/owner/qsar/submission-1/input_uuid-123.sdf",
          originalName: "molecule.sdf",
        },
        submittedAt: expect.any(String),
      }),
    );
    expect(prisma.qsarSubmission.update).toHaveBeenNthCalledWith(1, {
      where: { id: "submission-1" },
      data: {
        filename: "input_uuid-123.sdf",
        filePath: "/files/owner/qsar/submission-1/input_uuid-123.sdf",
      },
    });
    expect(prisma.qsarSubmission.update).toHaveBeenNthCalledWith(2, {
      where: { id: "submission-1" },
      data: {
        jobId: "job-1",
      },
    });
  });

  it("returns queue diagnostics for admins", async () => {
    const waitingJob = {
      id: "job-waiting",
      name: "calculate-qsar",
      data: { submissionId: "submission-1" },
      attemptsMade: 0,
      failedReason: undefined,
      timestamp: 1,
      processedOn: undefined,
      finishedOn: undefined,
      getState: vi.fn().mockResolvedValue("waiting"),
    };
    const activeJob = {
      id: "job-active",
      name: "calculate-qsar",
      data: { submissionId: "submission-2" },
      attemptsMade: 0,
      failedReason: undefined,
      timestamp: 2,
      processedOn: 3,
      finishedOn: undefined,
      getState: vi.fn().mockResolvedValue("active"),
    };
    const failedJob = {
      id: "job-failed",
      name: "calculate-qsar",
      data: { submissionId: "submission-3" },
      attemptsMade: 1,
      failedReason: "Mold2 failed",
      timestamp: 4,
      processedOn: 5,
      finishedOn: 6,
      getState: vi.fn().mockResolvedValue("failed"),
    };
    const queue = {
      getJobCounts: vi.fn().mockResolvedValue({ waiting: 11, active: 6, failed: 16 }),
      isPaused: vi.fn().mockResolvedValue(false),
      getWorkersCount: vi.fn().mockResolvedValue(1),
      getJobs: vi
        .fn()
        .mockResolvedValueOnce([waitingJob])
        .mockResolvedValueOnce([activeJob])
        .mockResolvedValueOnce([failedJob]),
      getJobState: vi.fn().mockResolvedValue("waiting"),
    };
    const prisma = {
      qsarSubmission: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "submission-1",
            originalName: "molecule.sdf",
            jobId: "job-waiting",
            errorMessage: null,
            createdAt: new Date("2026-05-17T00:00:00.000Z"),
            updatedAt: null,
          },
        ]),
        count: vi.fn().mockResolvedValue(21),
      },
    };
    const service = new QsarService(queue as any, prisma as any);

    await expect(
      service.getQueueDiagnostics({
        waitingPage: 2,
        activePage: 1,
        failedPage: 3,
        queuedPage: 4,
      }),
    ).resolves.toEqual({
      counts: { waiting: 11, active: 6, failed: 16 },
      paused: false,
      workerCount: 1,
      recentJobs: {
        waiting: {
          records: [
            {
              id: "job-waiting",
              name: "calculate-qsar",
              state: "waiting",
              submissionId: "submission-1",
              attemptsMade: 0,
              failedReason: null,
              timestamp: 1,
              processedOn: undefined,
              finishedOn: undefined,
            },
          ],
          total: 11,
        },
        active: {
          records: [
            {
              id: "job-active",
              name: "calculate-qsar",
              state: "active",
              submissionId: "submission-2",
              attemptsMade: 0,
              failedReason: null,
              timestamp: 2,
              processedOn: 3,
              finishedOn: undefined,
            },
          ],
          total: 6,
        },
        failed: {
          records: [
            {
              id: "job-failed",
              name: "calculate-qsar",
              state: "failed",
              submissionId: "submission-3",
              attemptsMade: 1,
              failedReason: "Mold2 failed",
              timestamp: 4,
              processedOn: 5,
              finishedOn: 6,
            },
          ],
          total: 16,
        },
      },
      queuedSubmissions: {
        records: [
          {
            id: "submission-1",
            originalName: "molecule.sdf",
            jobId: "job-waiting",
            redisState: "waiting",
            errorMessage: null,
            createdAt: new Date("2026-05-17T00:00:00.000Z"),
            updatedAt: null,
          },
        ],
        total: 21,
      },
    });

    expect(queue.getJobs).toHaveBeenNthCalledWith(1, "waiting", 10, 14, false);
    expect(queue.getJobs).toHaveBeenNthCalledWith(2, "active", 5, 9, false);
    expect(queue.getJobs).toHaveBeenNthCalledWith(3, "failed", 15, 19, false);
    expect(prisma.qsarSubmission.findMany).toHaveBeenCalledWith({
      where: { status: "QUEUED" },
      orderBy: { createdAt: "desc" },
      skip: 20,
      take: 5,
      select: {
        id: true,
        originalName: true,
        jobId: true,
        errorMessage: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    expect(prisma.qsarSubmission.count).toHaveBeenCalledWith({
      where: { status: "QUEUED" },
    });
  });

  it("requeues queued and failed submissions", async () => {
    existsSync.mockReturnValue(true);
    const queue = {
      add: vi.fn().mockResolvedValue({ id: "job-2" }),
    };
    const prisma = {
      qsarSubmission: {
        findFirst: vi.fn().mockResolvedValue({
          id: "submission-1",
          originalName: "molecule.sdf",
          filename: "input_uuid-123.sdf",
          filePath: "/files/owner/qsar/submission-1/input_uuid-123.sdf",
          status: "FAILED",
        }),
        update: vi.fn().mockResolvedValue({ id: "submission-1" }),
      },
    };
    const service = new QsarService(queue as any, prisma as any);

    await expect(service.requeueAdminSubmission("submission-1")).resolves.toEqual({
      calculation: "qsar",
      submissionId: "submission-1",
      jobId: "job-2",
      status: "queued",
      file: {
        filename: "input_uuid-123.sdf",
        path: "/files/owner/qsar/submission-1/input_uuid-123.sdf",
        originalName: "molecule.sdf",
      },
    });

    expect(queue.add).toHaveBeenCalledWith(
      "calculate-qsar",
      expect.objectContaining({
        calculation: "qsar",
        submissionId: "submission-1",
        file: {
          filename: "input_uuid-123.sdf",
          path: "/files/owner/qsar/submission-1/input_uuid-123.sdf",
          originalName: "molecule.sdf",
        },
        submittedAt: expect.any(String),
      }),
    );
    expect(prisma.qsarSubmission.update).toHaveBeenCalledWith({
      where: { id: "submission-1" },
      data: {
        status: "QUEUED",
        jobId: "job-2",
        errorMessage: null,
      },
    });
  });

  it.each(["PROCESSING", "COMPLETED"])("rejects requeue for %s submissions", async (status) => {
    const queue = {
      add: vi.fn(),
    };
    const prisma = {
      qsarSubmission: {
        findFirst: vi.fn().mockResolvedValue({
          id: "submission-1",
          originalName: "molecule.sdf",
          filename: "input_uuid-123.sdf",
          filePath: "/files/owner/qsar/submission-1/input_uuid-123.sdf",
          status,
        }),
      },
    };
    const service = new QsarService(queue as any, prisma as any);

    await expect(service.requeueAdminSubmission("submission-1")).rejects.toThrow(
      "Only queued or failed QSAR submissions can be requeued",
    );
    expect(queue.add).not.toHaveBeenCalled();
  });
});
