import { describe, expect, it, vi } from "vitest";

import { PlasmoConsumer } from "./plasmo.consumer.js";

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

describe("PlasmoConsumer", () => {
  it("persists parsed result rows and marks the task as completed", async () => {
    execSync.mockReturnValue(undefined);
    readFileSync.mockReturnValue(
      ["mol\tA\tB\tC", "1\t0.10\t0.20\t0.30", "2\t0.40\t0.50\t0.60", ""].join("\n"),
    );

    const prisma = {
      plasmoTask: {
        update: vi.fn().mockResolvedValue({ id: "task-1" }),
      },
      plasmoResult: {
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        createMany: vi.fn().mockResolvedValue({ count: 2 }),
      },
    };
    const consumer = new PlasmoConsumer(prisma as any);
    const data = {
      calculation: "plasmo" as const,
      taskId: "task-1",
      file: {
        filename: "input_uuid-123.sdf",
        path: "/files/owner/plasmo/task-1/input_uuid-123.sdf",
        originalName: "molecule.sdf",
      },
      submittedAt: "2026-05-17T00:00:00.000Z",
    };

    const result = await consumer.process({ data } as any);

    expect(execSync).toHaveBeenNthCalledWith(
      1,
      "Mold2 -i /files/owner/plasmo/task-1/input_uuid-123.sdf -o /files/owner/plasmo/task-1/out.txt -r /files/owner/plasmo/task-1/report.txt",
    );
    expect(execSync).toHaveBeenNthCalledWith(
      2,
      "cat /files/owner/plasmo/task-1/out.txt | cut -f 1,144,313,471 > /files/owner/plasmo/task-1/isolatedDescriptors.txt",
    );
    expect(readFileSync).toHaveBeenCalledWith(
      "/files/owner/plasmo/task-1/isolatedDescriptors.txt",
      "utf-8",
    );
    expect(prisma.plasmoTask.update).toHaveBeenNthCalledWith(1, {
      where: { id: "task-1" },
      data: {
        status: "PROCESSING",
        errorMessage: null,
      },
    });
    expect(prisma.plasmoTask.update).toHaveBeenNthCalledWith(2, {
      where: { id: "task-1" },
      data: {
        outputPath: "/files/owner/plasmo/task-1/out.txt",
        reportPath: "/files/owner/plasmo/task-1/report.txt",
        isolatedDescriptorsPath: "/files/owner/plasmo/task-1/isolatedDescriptors.txt",
      },
    });
    expect(prisma.plasmoResult.deleteMany).toHaveBeenCalledWith({
      where: { taskId: "task-1" },
    });
    expect(prisma.plasmoResult.createMany).toHaveBeenCalledTimes(1);

    const insertedRows = prisma.plasmoResult.createMany.mock.calls[0][0].data;
    expect(insertedRows).toHaveLength(2);
    expect(insertedRows[0]).toMatchObject({
      taskId: "task-1",
      moleculeNumber: 1,
      descriptorA: 0.1,
      descriptorB: 0.2,
      descriptorC: 0.3,
    });
    expect(insertedRows[0].pec50).toEqual(expect.any(Number));
    expect(insertedRows[0].ec50).toEqual(expect.any(Number));
    expect(insertedRows[1]).toMatchObject({
      taskId: "task-1",
      moleculeNumber: 2,
      descriptorA: 0.4,
      descriptorB: 0.5,
      descriptorC: 0.6,
    });
    expect(prisma.plasmoTask.update).toHaveBeenNthCalledWith(3, {
      where: { id: "task-1" },
      data: {
        status: "COMPLETED",
        errorMessage: null,
      },
    });
    expect(result).toMatchObject({
      calculation: "plasmo",
      taskId: "task-1",
      file: data.file,
    });
    expect(result.results).toHaveLength(2);
  });

  it("marks the task as failed when the worker command errors", async () => {
    execSync.mockImplementation(() => {
      throw new Error("Mold2 failed");
    });
    readFileSync.mockReset();

    const prisma = {
      plasmoTask: {
        update: vi.fn().mockResolvedValue({ id: "task-1" }),
      },
      plasmoResult: {
        deleteMany: vi.fn(),
        createMany: vi.fn(),
      },
    };
    const consumer = new PlasmoConsumer(prisma as any);
    const data = {
      calculation: "plasmo" as const,
      taskId: "task-1",
      file: {
        filename: "input_uuid-123.sdf",
        path: "/files/owner/plasmo/task-1/input_uuid-123.sdf",
        originalName: "molecule.sdf",
      },
      submittedAt: "2026-05-17T00:00:00.000Z",
    };

    await expect(consumer.process({ data } as any)).rejects.toThrow("Mold2 failed");

    expect(prisma.plasmoTask.update).toHaveBeenNthCalledWith(1, {
      where: { id: "task-1" },
      data: {
        status: "PROCESSING",
        errorMessage: null,
      },
    });
    expect(prisma.plasmoTask.update).toHaveBeenNthCalledWith(2, {
      where: { id: "task-1" },
      data: {
        status: "FAILED",
        errorMessage: "Mold2 failed",
      },
    });
    expect(prisma.plasmoResult.deleteMany).not.toHaveBeenCalled();
    expect(prisma.plasmoResult.createMany).not.toHaveBeenCalled();
    expect(readFileSync).not.toHaveBeenCalled();
  });
});
