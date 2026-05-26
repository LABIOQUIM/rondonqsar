import { Logger } from "@nestjs/common";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { QsarQueueBootstrapService } from "./qsar-queue-bootstrap.service.js";

describe("QsarQueueBootstrapService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("resumes a paused qsar queue on startup", async () => {
    const warn = vi.spyOn(Logger.prototype, "warn").mockImplementation(() => undefined);
    const log = vi.spyOn(Logger.prototype, "log").mockImplementation(() => undefined);
    const queue = {
      waitUntilReady: vi.fn().mockResolvedValue(undefined),
      isPaused: vi.fn().mockResolvedValue(true),
      resume: vi.fn().mockResolvedValue(undefined),
      getJobCounts: vi.fn().mockResolvedValue({ waiting: 1 }),
      getWorkersCount: vi.fn().mockResolvedValue(1),
    };
    const service = new QsarQueueBootstrapService(queue as any);

    await service.onApplicationBootstrap();

    expect(queue.waitUntilReady).toHaveBeenCalledWith();
    expect(queue.resume).toHaveBeenCalledWith();
    expect(warn).toHaveBeenCalledWith("QSAR queue was paused on startup. Resuming processing.");
    expect(log).toHaveBeenCalledWith('QSAR queue ready: workers=1, counts={"waiting":1}');
  });

  it("logs queue counts when the queue is ready", async () => {
    const log = vi.spyOn(Logger.prototype, "log").mockImplementation(() => undefined);
    const queue = {
      waitUntilReady: vi.fn().mockResolvedValue(undefined),
      isPaused: vi.fn().mockResolvedValue(false),
      resume: vi.fn(),
      getJobCounts: vi.fn().mockResolvedValue({ waiting: 0, active: 0 }),
      getWorkersCount: vi.fn().mockResolvedValue(2),
    };
    const service = new QsarQueueBootstrapService(queue as any);

    await service.onApplicationBootstrap();

    expect(queue.resume).not.toHaveBeenCalled();
    expect(log).toHaveBeenCalledWith(
      'QSAR queue ready: workers=2, counts={"waiting":0,"active":0}',
    );
  });

  it("fails startup when Redis queue readiness fails", async () => {
    const queue = {
      waitUntilReady: vi.fn().mockRejectedValue(new Error("redis unavailable")),
      isPaused: vi.fn(),
      resume: vi.fn(),
      getJobCounts: vi.fn(),
      getWorkersCount: vi.fn(),
    };
    const service = new QsarQueueBootstrapService(queue as any);

    await expect(service.onApplicationBootstrap()).rejects.toThrow("redis unavailable");

    expect(queue.isPaused).not.toHaveBeenCalled();
  });
});
