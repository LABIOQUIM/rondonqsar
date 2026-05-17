import { BadRequestException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import { LeishController } from "./leish.controller.js";
import { type LeishService } from "./leish.service.js";

describe("LeishController", () => {
  const file = {
    filename: "input_uuid-123.sdf",
    path: "/files/owner/leish/input_uuid-123.sdf",
    originalname: "molecule.sdf",
  } as Express.Multer.File;

  it("submits uploaded files to the leish service", async () => {
    const submit = vi.fn().mockResolvedValue({ jobId: "1" });
    const controller = new LeishController({
      submit,
    } as unknown as LeishService);

    await expect(controller.submit(file)).resolves.toEqual({ jobId: "1" });
    expect(submit).toHaveBeenCalledWith(file);
  });

  it("rejects requests without an uploaded file", () => {
    const controller = new LeishController({} as LeishService);

    expect(() => controller.submit()).toThrow(BadRequestException);
  });
});
