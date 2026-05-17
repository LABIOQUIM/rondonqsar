import { describe, expect, it, vi } from "vitest";

import { PlasmoService } from "./plasmo.service.js";

describe("PlasmoService", () => {
  it("enqueues plasmo calculation jobs", async () => {
    const queue = {
      add: vi.fn().mockResolvedValue({ id: "job-1" }),
    };
    const service = new PlasmoService(queue as any);
    const file = {
      filename: "input_uuid-123.sdf",
      path: "/files/owner/plasmo/input_uuid-123.sdf",
      originalname: "molecule.sdf",
    } as Express.Multer.File;

    await expect(service.submit(file)).resolves.toEqual({
      calculation: "plasmo",
      jobId: "job-1",
      status: "queued",
      file: {
        filename: "input_uuid-123.sdf",
        path: "/files/owner/plasmo/input_uuid-123.sdf",
        originalName: "molecule.sdf",
      },
    });
    expect(queue.add).toHaveBeenCalledWith(
      "calculate-plasmo",
      expect.objectContaining({
        calculation: "plasmo",
        file: expect.objectContaining({
          path: "/files/owner/plasmo/input_uuid-123.sdf",
        }),
        submittedAt: expect.any(String),
      }),
    );
  });
});
