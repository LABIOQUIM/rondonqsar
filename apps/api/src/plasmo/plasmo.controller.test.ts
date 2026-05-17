import { BadRequestException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import { PlasmoController } from "./plasmo.controller.js";
import { type PlasmoService } from "./plasmo.service.js";

describe("PlasmoController", () => {
  const file = {
    filename: "input_uuid-123.sdf",
    path: "/files/owner/plasmo/input_uuid-123.sdf",
    originalname: "molecule.sdf",
  } as Express.Multer.File;

  it("submits uploaded files to the plasmo service", async () => {
    const submit = vi.fn().mockResolvedValue({ jobId: "1" });
    const controller = new PlasmoController({
      submit,
    } as unknown as PlasmoService);

    await expect(controller.submit(file)).resolves.toEqual({ jobId: "1" });
    expect(submit).toHaveBeenCalledWith(file);
  });

  it("rejects requests without an uploaded file", () => {
    const controller = new PlasmoController({} as PlasmoService);

    expect(() => controller.submit()).toThrow(BadRequestException);
  });
});
