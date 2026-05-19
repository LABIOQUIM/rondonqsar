import { NotFoundException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import { LeishService } from "./leish.service.js";

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

describe("LeishService", () => {
  it("lists the current user's leish tasks with pagination and result counts", async () => {
    const queue = {
      add: vi.fn(),
    };
    const createdAt = new Date("2026-05-18T10:00:00.000Z");
    const updatedAt = new Date("2026-05-18T10:05:00.000Z");
    const prisma = {
      leishTask: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "task-1",
            originalName: "molecule.sdf",
            status: "COMPLETED",
            jobId: "job-1",
            errorMessage: null,
            createdAt,
            updatedAt,
            _count: {
              results: 3,
            },
          },
        ]),
        count: vi.fn().mockResolvedValue(12),
      },
    };
    const service = new LeishService(queue as any, prisma as any);

    await expect(service.findCurrentUser("user-id", { pageSize: 5, page: 2 })).resolves.toEqual({
      records: [
        {
          id: "task-1",
          originalName: "molecule.sdf",
          status: "COMPLETED",
          jobId: "job-1",
          errorMessage: null,
          createdAt,
          updatedAt,
          resultCount: 3,
        },
      ],
      total: 12,
    });

    expect(prisma.leishTask.findMany).toHaveBeenCalledWith({
      where: { userId: "user-id" },
      orderBy: { createdAt: "desc" },
      skip: 10,
      take: 5,
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
            results: true,
          },
        },
      },
    });
    expect(prisma.leishTask.count).toHaveBeenCalledWith({
      where: { userId: "user-id" },
    });
  });

  it("finds a current user's leish task details with sorted results and result count", async () => {
    const queue = {
      add: vi.fn(),
    };
    const createdAt = new Date("2026-05-18T10:00:00.000Z");
    const updatedAt = new Date("2026-05-18T10:05:00.000Z");
    const prisma = {
      leishTask: {
        findFirst: vi.fn().mockResolvedValue({
          id: "task-1",
          originalName: "molecule.sdf",
          status: "COMPLETED",
          jobId: "job-1",
          errorMessage: null,
          createdAt,
          updatedAt,
          results: [
            {
              moleculeNumber: 1,
              descriptorA: 1.1,
              descriptorB: 2.2,
              descriptorC: 3.3,
              descriptorD: 4.4,
              pec50: 4.4,
              ec50: 5.5,
            },
          ],
          _count: {
            results: 1,
          },
        }),
      },
    };
    const service = new LeishService(queue as any, prisma as any);

    await expect(service.findCurrentUserTask("user-id", "task-1")).resolves.toEqual({
      id: "task-1",
      originalName: "molecule.sdf",
      status: "COMPLETED",
      jobId: "job-1",
      errorMessage: null,
      createdAt,
      updatedAt,
      resultCount: 1,
      results: [
        {
          moleculeNumber: 1,
          descriptorA: 1.1,
          descriptorB: 2.2,
          descriptorC: 3.3,
          descriptorD: 4.4,
          pec50: 4.4,
          ec50: 5.5,
        },
      ],
    });

    expect(prisma.leishTask.findFirst).toHaveBeenCalledWith({
      where: {
        id: "task-1",
        userId: "user-id",
      },
      select: {
        id: true,
        originalName: true,
        status: true,
        jobId: true,
        errorMessage: true,
        createdAt: true,
        updatedAt: true,
        results: {
          orderBy: {
            moleculeNumber: "asc",
          },
          select: {
            moleculeNumber: true,
            descriptorA: true,
            descriptorB: true,
            descriptorC: true,
            descriptorD: true,
            pec50: true,
            ec50: true,
          },
        },
        _count: {
          select: {
            results: true,
          },
        },
      },
    });
  });

  it("throws not found when the current user's leish task does not exist", async () => {
    const queue = {
      add: vi.fn(),
    };
    const prisma = {
      leishTask: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    };
    const service = new LeishService(queue as any, prisma as any);

    await expect(service.findCurrentUserTask("user-id", "task-1")).rejects.toThrow(
      NotFoundException,
    );
  });

  it("creates a task, moves the file, and enqueues leish calculation jobs", async () => {
    const queue = {
      add: vi.fn().mockResolvedValue({ id: "job-1" }),
    };
    const prisma = {
      leishTask: {
        create: vi.fn().mockResolvedValue({ id: "task-1" }),
        update: vi.fn().mockResolvedValue({ id: "task-1" }),
      },
    };
    const service = new LeishService(queue as any, prisma as any);
    const file = {
      filename: "input_uuid-123.sdf",
      path: "/files/owner/leish/input_uuid-123.sdf",
      originalname: "molecule.sdf",
    } as Express.Multer.File;
    const user = {
      id: "user-id",
      username: "owner",
    };

    await expect(service.submit(file, user)).resolves.toEqual({
      calculation: "leish",
      taskId: "task-1",
      jobId: "job-1",
      status: "queued",
      file: {
        filename: "input_uuid-123.sdf",
        path: "/files/owner/leish/task-1/input_uuid-123.sdf",
        originalName: "molecule.sdf",
      },
    });

    expect(prisma.leishTask.create).toHaveBeenCalledWith({
      data: {
        userId: "user-id",
        originalName: "molecule.sdf",
        filename: "input_uuid-123.sdf",
        filePath: "/files/owner/leish/input_uuid-123.sdf",
        status: "QUEUED",
      },
    });
    expect(mkdirSync).toHaveBeenCalledWith("/files/owner/leish/task-1", {
      recursive: true,
    });
    expect(renameSync).toHaveBeenCalledWith(
      "/files/owner/leish/input_uuid-123.sdf",
      "/files/owner/leish/task-1/input_uuid-123.sdf",
    );
    expect(queue.add).toHaveBeenCalledWith(
      "calculate-leish",
      expect.objectContaining({
        calculation: "leish",
        taskId: "task-1",
        file: {
          filename: "input_uuid-123.sdf",
          path: "/files/owner/leish/task-1/input_uuid-123.sdf",
          originalName: "molecule.sdf",
        },
        submittedAt: expect.any(String),
      }),
    );
    expect(prisma.leishTask.update).toHaveBeenNthCalledWith(1, {
      where: { id: "task-1" },
      data: {
        filename: "input_uuid-123.sdf",
        filePath: "/files/owner/leish/task-1/input_uuid-123.sdf",
      },
    });
    expect(prisma.leishTask.update).toHaveBeenNthCalledWith(2, {
      where: { id: "task-1" },
      data: {
        jobId: "job-1",
      },
    });
  });
});
