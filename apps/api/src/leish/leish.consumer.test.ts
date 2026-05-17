import { describe, expect, it } from "vitest";

import { LeishConsumer } from "./leish.consumer.js";

describe("LeishConsumer", () => {
  it("runs the leish calculation for queued jobs", async () => {
    const consumer = new LeishConsumer();
    const data = {
      calculation: "leish" as const,
      file: {
        filename: "input_uuid-123.sdf",
        path: "/files/owner/leish/input_uuid-123.sdf",
        originalName: "molecule.sdf",
      },
      submittedAt: "2026-05-17T00:00:00.000Z",
    };

    await expect(consumer.process({ data } as any)).resolves.toEqual({
      calculation: "leish",
      file: data.file,
    });
  });
});
