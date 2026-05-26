import { Logger } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import { QsarConsumer } from "./qsar.consumer.js";

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

describe("QsarConsumer", () => {
  it("runs Mold2 once, persists both result sets, and marks the submission as completed", async () => {
    execSync.mockReturnValue(undefined);
    readFileSync.mockImplementation((filePath: string) => {
      if (filePath.endsWith("plasmoIsolatedDescriptors.txt")) {
        return ["mol\tA\tB\tC", "1\t0.10\t0.20\t0.30", "2\t0.40\t0.50\t0.60", ""].join("\n");
      }

      return ["Mol\tD237\tD215\tD466\tD590", "1\t1.1\t2.2\t3.3\t4.4", "2\t4.4\t5.5\t6.6\t7.7", ""].join(
        "\n",
      );
    });

    const prisma = {
      qsarSubmission: {
        update: vi.fn().mockResolvedValue({ id: "submission-1" }),
      },
      plasmoResult: {
        deleteMany: vi.fn().mockReturnValue({ operation: "delete-plasmo" }),
        createMany: vi.fn().mockReturnValue({ operation: "create-plasmo" }),
      },
      leishResult: {
        deleteMany: vi.fn().mockReturnValue({ operation: "delete-leish" }),
        createMany: vi.fn().mockReturnValue({ operation: "create-leish" }),
      },
      $transaction: vi.fn().mockResolvedValue([]),
    };
    const consumer = new QsarConsumer(prisma as any);
    const data = {
      calculation: "qsar" as const,
      submissionId: "submission-1",
      file: {
        filename: "input_uuid-123.sdf",
        path: "/files/owner/qsar/submission-1/input_uuid-123.sdf",
        originalName: "molecule.sdf",
      },
      submittedAt: "2026-05-17T00:00:00.000Z",
    };

    const result = await consumer.process({ data } as any);

    expect(execSync).toHaveBeenNthCalledWith(
      1,
      "Mold2 -i /files/owner/qsar/submission-1/input_uuid-123.sdf -o /files/owner/qsar/submission-1/out.txt -r /files/owner/qsar/submission-1/report.txt",
    );
    expect(execSync).toHaveBeenNthCalledWith(
      2,
      "awk -F '\\t' 'BEGIN {OFS=\"\\t\"} {print $1,$144,$313,$471}' /files/owner/qsar/submission-1/out.txt > /files/owner/qsar/submission-1/plasmoIsolatedDescriptors.txt",
    );
    expect(execSync).toHaveBeenNthCalledWith(
      3,
      "awk -F '\\t' 'BEGIN {OFS=\"\\t\"} {print $1,$238,$216,$467,$591}' /files/owner/qsar/submission-1/out.txt > /files/owner/qsar/submission-1/leishIsolatedDescriptors.txt",
    );
    expect(readFileSync).toHaveBeenCalledWith(
      "/files/owner/qsar/submission-1/plasmoIsolatedDescriptors.txt",
      "utf-8",
    );
    expect(readFileSync).toHaveBeenCalledWith(
      "/files/owner/qsar/submission-1/leishIsolatedDescriptors.txt",
      "utf-8",
    );
    expect(prisma.qsarSubmission.update).toHaveBeenNthCalledWith(1, {
      where: { id: "submission-1" },
      data: {
        status: "PROCESSING",
        errorMessage: null,
      },
    });
    expect(prisma.qsarSubmission.update).toHaveBeenNthCalledWith(2, {
      where: { id: "submission-1" },
      data: {
        outputPath: "/files/owner/qsar/submission-1/out.txt",
        reportPath: "/files/owner/qsar/submission-1/report.txt",
        plasmoIsolatedDescriptorsPath:
          "/files/owner/qsar/submission-1/plasmoIsolatedDescriptors.txt",
        leishIsolatedDescriptorsPath: "/files/owner/qsar/submission-1/leishIsolatedDescriptors.txt",
      },
    });
    expect(prisma.plasmoResult.deleteMany).toHaveBeenCalledWith({
      where: { submissionId: "submission-1" },
    });
    expect(prisma.leishResult.deleteMany).toHaveBeenCalledWith({
      where: { submissionId: "submission-1" },
    });

    const insertedPlasmoRows = prisma.plasmoResult.createMany.mock.calls[0][0].data;
    const insertedLeishRows = prisma.leishResult.createMany.mock.calls[0][0].data;

    expect(insertedPlasmoRows).toHaveLength(2);
    expect(insertedPlasmoRows[0]).toMatchObject({
      submissionId: "submission-1",
      moleculeNumber: 1,
      descriptorA: 0.1,
      descriptorB: 0.2,
      descriptorC: 0.3,
    });
    expect(insertedPlasmoRows[0].pec50).toBeCloseTo(-342.02376342124836, 8);
    expect(insertedPlasmoRows[0].ec50).toEqual(expect.any(Number));
    expect(insertedLeishRows).toHaveLength(2);
    expect(insertedLeishRows[0]).toMatchObject({
      submissionId: "submission-1",
      moleculeNumber: 1,
      descriptorA: 1.1,
      descriptorB: 2.2,
      descriptorC: 3.3,
      descriptorD: 4.4,
    });
    expect(insertedLeishRows[0].pec50).toBeCloseTo(5964.10148217978, 8);
    expect(insertedLeishRows[0].ec50).toEqual(expect.any(Number));
    expect(prisma.$transaction).toHaveBeenCalledWith([
      { operation: "delete-plasmo" },
      { operation: "delete-leish" },
      { operation: "create-plasmo" },
      { operation: "create-leish" },
    ]);
    expect(prisma.qsarSubmission.update).toHaveBeenNthCalledWith(3, {
      where: { id: "submission-1" },
      data: {
        status: "COMPLETED",
        errorMessage: null,
      },
    });
    expect(result).toMatchObject({
      calculation: "qsar",
      submissionId: "submission-1",
      file: data.file,
    });
    expect(result.plasmoResults).toHaveLength(2);
    expect(result.leishResults).toHaveLength(2);
  });

  it("marks the submission as failed and avoids result writes when Mold2 fails", async () => {
    execSync.mockImplementation(() => {
      throw new Error("Mold2 failed");
    });
    readFileSync.mockReset();

    const prisma = {
      qsarSubmission: {
        update: vi.fn().mockResolvedValue({ id: "submission-1" }),
      },
      plasmoResult: {
        deleteMany: vi.fn(),
        createMany: vi.fn(),
      },
      leishResult: {
        deleteMany: vi.fn(),
        createMany: vi.fn(),
      },
      $transaction: vi.fn(),
    };
    const consumer = new QsarConsumer(prisma as any);
    const data = {
      calculation: "qsar" as const,
      submissionId: "submission-1",
      file: {
        filename: "input_uuid-123.sdf",
        path: "/files/owner/qsar/submission-1/input_uuid-123.sdf",
        originalName: "molecule.sdf",
      },
      submittedAt: "2026-05-17T00:00:00.000Z",
    };

    await expect(consumer.process({ data } as any)).rejects.toThrow("Mold2 failed");

    expect(prisma.qsarSubmission.update).toHaveBeenNthCalledWith(1, {
      where: { id: "submission-1" },
      data: {
        status: "PROCESSING",
        errorMessage: null,
      },
    });
    expect(prisma.qsarSubmission.update).toHaveBeenNthCalledWith(2, {
      where: { id: "submission-1" },
      data: {
        status: "FAILED",
        errorMessage: "Mold2 failed",
      },
    });
    expect(prisma.plasmoResult.deleteMany).not.toHaveBeenCalled();
    expect(prisma.plasmoResult.createMany).not.toHaveBeenCalled();
    expect(prisma.leishResult.deleteMany).not.toHaveBeenCalled();
    expect(prisma.leishResult.createMany).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(readFileSync).not.toHaveBeenCalled();
  });

  it("logs worker lifecycle events", () => {
    const log = vi.spyOn(Logger.prototype, "log").mockImplementation(() => undefined);
    const warn = vi.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);
    const error = vi.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);
    const consumer = new QsarConsumer({} as any);
    const job = {
      id: "job-1",
      data: {
        submissionId: "submission-1",
      },
    };

    consumer.onReady();
    consumer.onActive(job as any);
    consumer.onCompleted(job as any);
    consumer.onFailed(job as any, new Error("Mold2 failed"));
    consumer.onError(new Error("redis failed"));
    consumer.onStalled("job-2");
    consumer.onLockRenewalFailed(["job-3", "job-4"]);

    expect(log).toHaveBeenCalledWith("QSAR worker ready.");
    expect(log).toHaveBeenCalledWith("QSAR job job-1 active for submission submission-1.");
    expect(log).toHaveBeenCalledWith("QSAR job job-1 completed for submission submission-1.");
    expect(error).toHaveBeenCalledWith(
      "QSAR job job-1 failed for submission submission-1: Mold2 failed",
      expect.any(String),
    );
    expect(error).toHaveBeenCalledWith("QSAR worker error: redis failed", expect.any(String));
    expect(warn).toHaveBeenCalledWith("QSAR job job-2 stalled and was returned to the queue.");
    expect(error).toHaveBeenCalledWith(
      "QSAR worker failed to renew locks for jobs: job-3, job-4",
    );

    log.mockRestore();
    warn.mockRestore();
    error.mockRestore();
  });
});
