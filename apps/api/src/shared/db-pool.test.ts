import { describe, expect, it, vi } from "vitest";

import { withEnv } from "../test-utils/env.js";

vi.mock("pg", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    default: {
      ...(actual.default as Record<string, unknown>),
      Pool: class {
        options: unknown;
        constructor(options: unknown) {
          this.options = options;
        }
      },
    },
  };
});

const prismaPg = vi.fn();

vi.mock("@prisma/adapter-pg", () => ({
  PrismaPg: class {
    constructor(...args: unknown[]) {
      prismaPg(...args);
    }
  },
}));

describe("db-pool", () => {
  it("creates a pool with default options from database env vars", async () => {
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
        prismaPg.mockClear();

        const { createPrismaAdapter } = await import("./db-pool.js");

        createPrismaAdapter();

        expect(prismaPg).toHaveBeenCalledTimes(1);
        const [poolArg, adapterOpts] = prismaPg.mock.calls[0];
        expect(poolArg.options).toEqual({
          connectionString: "postgresql://dbuser:dbpass@dbhost:5432/dbname",
          max: 5,
          connectionTimeoutMillis: 5000,
          idleTimeoutMillis: 30000,
        });
        expect(adapterOpts).toEqual({ disposeExternalPool: false });
      },
    );
  });

  it("respects pool-tuning env vars", async () => {
    await withEnv(
      {
        DB_USER: "dbuser",
        DB_PASS: "dbpass",
        DB_HOST: "dbhost",
        DB_PORT: "5432",
        DB_DATABASE: "dbname",
        DB_POOL_MAX: "3",
        DB_POOL_CONNECTION_TIMEOUT: "2000",
        DB_POOL_IDLE_TIMEOUT: "15000",
        DB_STATEMENT_TIMEOUT: "10000",
        DB_KEEPALIVES_IDLE: "60000",
      },
      async () => {
        vi.resetModules();
        prismaPg.mockClear();

        const { createPrismaAdapter } = await import("./db-pool.js");

        createPrismaAdapter();

        const [poolArg] = prismaPg.mock.calls[0];
        expect(poolArg.options).toMatchObject({
          max: 3,
          connectionTimeoutMillis: 2000,
          idleTimeoutMillis: 15000,
          statement_timeout: 10000,
          keepalives_idle: 60000,
        });
      },
    );
  });

  it("returns the same pool instance on multiple adapter calls", async () => {
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
        prismaPg.mockClear();

        const { createPrismaAdapter } = await import("./db-pool.js");

        createPrismaAdapter();
        createPrismaAdapter();

        expect(prismaPg).toHaveBeenCalledTimes(2);
        const poolArg1 = prismaPg.mock.calls[0][0];
        const poolArg2 = prismaPg.mock.calls[1][0];
        expect(poolArg1).toBe(poolArg2);
      },
    );
  });
});
