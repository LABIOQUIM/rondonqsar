import { Logger } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import { withEnv } from "./test-utils/env.js";

const prismaClient = vi.fn();
const queryRaw = vi.fn();
const mockAdapter = vi.hoisted(() => ({}));
const createPrismaAdapter = vi.hoisted(() => vi.fn(() => mockAdapter));

vi.mock("./shared/db-pool.js", () => ({
  createPrismaAdapter,
}));

vi.mock("./generated/prisma/client.js", () => ({
  PrismaClient: class {
    constructor(options: unknown) {
      prismaClient(options);
      this.$queryRaw = queryRaw;
    }
  },
}));

describe("PrismaService", () => {
  it("builds the PrismaClient with the adapter from createPrismaAdapter", async () => {
    await withEnv(
      {
        DB_USER: "dbuser",
        DB_PASS: "dbpass",
        DB_HOST: "dbhost",
        DB_PORT: "5432",
        DB_DATABASE: "dbname",
      },
      async () => {
        vi.resetModules();
        prismaClient.mockClear();
        createPrismaAdapter.mockClear();

        const { PrismaService } = await import("./prisma.service.js");

        new PrismaService();

        expect(prismaClient).toHaveBeenCalledWith({
          adapter: mockAdapter,
        });
      },
    );
  });

  it("logs when database connection is established on init", async () => {
    await withEnv(
      {
        DB_USER: "u",
        DB_PASS: "p",
        DB_HOST: "h",
        DB_PORT: "5432",
        DB_DATABASE: "db",
      },
      async () => {
        vi.resetModules();
        queryRaw.mockResolvedValue([{ "?column?": 1 }]);

        const logSpy = vi.spyOn(Logger.prototype, "debug").mockImplementation(() => undefined);

        const { PrismaService } = await import("./prisma.service.js");

        const service = new PrismaService();
        await service.onModuleInit();

        expect(logSpy).toHaveBeenCalledWith("Database connection established");

        logSpy.mockRestore();
      },
    );
  });

  it("logs error when database connection fails on init", async () => {
    await withEnv(
      {
        DB_USER: "u",
        DB_PASS: "p",
        DB_HOST: "h",
        DB_PORT: "5432",
        DB_DATABASE: "db",
      },
      async () => {
        vi.resetModules();
        queryRaw.mockRejectedValue(new Error("connection refused"));

        const errorSpy = vi
          .spyOn(Logger.prototype, "error")
          .mockImplementation(() => undefined);

        const { PrismaService } = await import("./prisma.service.js");

        const service = new PrismaService();
        await service.onModuleInit();

        expect(errorSpy).toHaveBeenCalledWith(
          "Failed to connect to database",
          expect.any(String),
        );

        errorSpy.mockRestore();
      },
    );
  });
});
