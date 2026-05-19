import { describe, expect, it, vi } from "vitest";

import { LeishConsumer } from "./leish.consumer.js";

const { execSync } = vi.hoisted(() => ({
  execSync: vi.fn(),
}));

const { readFileSync } = vi.hoisted(() => ({
  readFileSync: vi.fn(),
}));

vi.mock("child_process", () => ({
  execSync,
}));

vi.mock("fs", () => ({
  default: {
    readFileSync,
  },
  readFileSync,
}));

describe("LeishConsumer", () => {
  it("persists parsed result rows and marks the task as completed", async () => {
    readFileSync.mockReturnValue(
      ["Mol\tD237\tD215\tD466\tD590", "1\t1.1\t2.2\t3.3\t4.4", "2\t4.4\t5.5\t6.6\t7.7", ""].join(
        "\n",
      ),
    );
    const prisma = {
      leishTask: {
        update: vi.fn().mockResolvedValue({ id: "task-1" }),
      },
      leishResult: {
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        createMany: vi.fn().mockResolvedValue({ count: 2 }),
      },
    };
    const consumer = new LeishConsumer(prisma as any);
    const data = {
      calculation: "leish" as const,
      taskId: "task-1",
      file: {
        filename: "input_uuid-123.sdf",
        path: "/files/owner/leish/task-1/input_uuid-123.sdf",
        originalName: "molecule.sdf",
      },
      submittedAt: "2026-05-17T00:00:00.000Z",
    };

    const result = await consumer.process({ data } as any);

    expect(execSync).toHaveBeenNthCalledWith(
      1,
      "Mold2 -i /files/owner/leish/task-1/input_uuid-123.sdf -o /files/owner/leish/task-1/out.txt -r /files/owner/leish/task-1/report.txt",
    );
    expect(execSync).toHaveBeenNthCalledWith(
      2,
      "awk -F '\\t' 'BEGIN {OFS=\"\\t\"} {print $1,$238,$216,$467,$591}' /files/owner/leish/task-1/out.txt > /files/owner/leish/task-1/isolatedDescriptors.txt",
    );
    expect(readFileSync).toHaveBeenCalledWith(
      "/files/owner/leish/task-1/isolatedDescriptors.txt",
      "utf-8",
    );
    expect(prisma.leishTask.update).toHaveBeenNthCalledWith(1, {
      where: { id: "task-1" },
      data: {
        status: "PROCESSING",
        errorMessage: null,
      },
    });
    expect(prisma.leishTask.update).toHaveBeenNthCalledWith(2, {
      where: { id: "task-1" },
      data: {
        outputPath: "/files/owner/leish/task-1/out.txt",
        reportPath: "/files/owner/leish/task-1/report.txt",
        isolatedDescriptorsPath: "/files/owner/leish/task-1/isolatedDescriptors.txt",
      },
    });
    expect(prisma.leishResult.deleteMany).toHaveBeenCalledWith({
      where: { taskId: "task-1" },
    });
    expect(prisma.leishResult.createMany).toHaveBeenCalledTimes(1);

    const insertedRows = prisma.leishResult.createMany.mock.calls[0][0].data;

    expect(insertedRows).toHaveLength(2);
    expect(insertedRows[0]).toMatchObject({
      taskId: "task-1",
      moleculeNumber: 1,
      descriptorA: 1.1,
      descriptorB: 2.2,
      descriptorC: 3.3,
      descriptorD: 4.4,
    });
    expect(insertedRows[0].pec50).toBeCloseTo(5964.10148217978, 8);
    expect(insertedRows[0].ec50).toEqual(expect.any(Number));
    expect(prisma.leishTask.update).toHaveBeenNthCalledWith(3, {
      where: { id: "task-1" },
      data: {
        status: "COMPLETED",
        errorMessage: null,
      },
    });
    expect(result).toMatchObject({
      calculation: "leish",
      taskId: "task-1",
      file: data.file,
    });
    expect(result.results).toHaveLength(2);
  });

  it("marks the task as failed when the calculation throws", async () => {
    const error = new Error("Mold2 failed");
    execSync.mockImplementationOnce(() => {
      throw error;
    });
    const prisma = {
      leishTask: {
        update: vi.fn().mockResolvedValue({ id: "task-1" }),
      },
      leishResult: {
        deleteMany: vi.fn(),
        createMany: vi.fn(),
      },
    };
    const consumer = new LeishConsumer(prisma as any);
    const data = {
      calculation: "leish" as const,
      taskId: "task-1",
      file: {
        filename: "input_uuid-123.sdf",
        path: "/files/owner/leish/task-1/input_uuid-123.sdf",
        originalName: "molecule.sdf",
      },
      submittedAt: "2026-05-17T00:00:00.000Z",
    };

    await expect(consumer.process({ data } as any)).rejects.toThrow(error);

    expect(prisma.leishTask.update).toHaveBeenNthCalledWith(1, {
      where: { id: "task-1" },
      data: {
        status: "PROCESSING",
        errorMessage: null,
      },
    });
    expect(prisma.leishTask.update).toHaveBeenNthCalledWith(2, {
      where: { id: "task-1" },
      data: {
        status: "FAILED",
        errorMessage: "Mold2 failed",
      },
    });
    expect(prisma.leishResult.deleteMany).not.toHaveBeenCalled();
    expect(prisma.leishResult.createMany).not.toHaveBeenCalled();
  });
});
