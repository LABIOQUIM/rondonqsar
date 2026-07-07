import { Injectable, Logger, OnModuleInit } from "@nestjs/common";

import { PrismaClient } from "./generated/prisma/client.js";
import { createPrismaAdapter } from "./shared/db-pool.js";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const adapter = createPrismaAdapter();

    super({ adapter });
  }

  async onModuleInit() {
    try {
      await this.$queryRaw`SELECT 1`;
      this.logger.debug("Database connection established");
    } catch (error) {
      this.logger.error(
        "Failed to connect to database",
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
