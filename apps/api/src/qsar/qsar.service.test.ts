import { NotFoundException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import { QsarService } from "./qsar.service.js";

const { mkdirSync, renameSync } = vi.hoisted(() => ({
  mkdirSync: vi.fn(),
  renameSync: vi.fn(),
}));

vi.mock("fs", () => ({
  default: {
    mkdirSync,
    renameSync,
  },
  mkdirSync,
  renameSync,
}));

describe("QsarService", () => {
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
});
