import { describe, expect, it, vi } from "vitest";

import { LeishService } from "./leish.service.js";

describe("LeishService", () => {
  it("enqueues leish calculation jobs", async () => {
    const queue = {
      add: vi.fn().mockResolvedValue({ id: "job-1" }),
    };
    const service = new LeishService(queue as any);
    const file = {
      filename: "input_uuid-123.sdf",
      path: "/files/owner/leish/input_uuid-123.sdf",
      originalname: "molecule.sdf",
    } as Express.Multer.File;

    await expect(service.submit(file)).resolves.toEqual({
      calculation: "leish",
      jobId: "job-1",
      status: "queued",
      file: {
        filename: "input_uuid-123.sdf",
        path: "/files/owner/leish/input_uuid-123.sdf",
        originalName: "molecule.sdf",
      },
    });
    expect(queue.add).toHaveBeenCalledWith(
      "calculate-leish",
      expect.objectContaining({
        calculation: "leish",
        file: expect.objectContaining({
          path: "/files/owner/leish/input_uuid-123.sdf",
        }),
        submittedAt: expect.any(String),
      }),
    );
  });
});
