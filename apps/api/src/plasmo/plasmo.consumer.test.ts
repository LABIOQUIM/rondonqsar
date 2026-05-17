import { describe, expect, it } from "vitest";

import { PlasmoConsumer } from "./plasmo.consumer.js";

describe("PlasmoConsumer", () => {
  it("runs the plasmo calculation for queued jobs", async () => {
    const consumer = new PlasmoConsumer();
    const data = {
      calculation: "plasmo" as const,
      file: {
        filename: "input_uuid-123.sdf",
        path: "/files/owner/plasmo/input_uuid-123.sdf",
        originalName: "molecule.sdf",
      },
      submittedAt: "2026-05-17T00:00:00.000Z",
    };

    await expect(consumer.process({ data } as any)).resolves.toEqual({
      calculation: "plasmo",
      file: data.file,
    });
  });
});
