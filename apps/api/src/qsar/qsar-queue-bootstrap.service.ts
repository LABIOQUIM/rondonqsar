import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, Logger, OnApplicationBootstrap } from "@nestjs/common";
import type { Queue } from "bullmq";

import { QSAR_QUEUE } from "./qsar.types.js";

@Injectable()
export class QsarQueueBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(QsarQueueBootstrapService.name);

  constructor(@InjectQueue(QSAR_QUEUE) private readonly qsarQueue: Queue) {}

  async onApplicationBootstrap() {
    await this.qsarQueue.waitUntilReady();

    if (await this.qsarQueue.isPaused()) {
      this.logger.warn("QSAR queue was paused on startup. Resuming processing.");
      await this.qsarQueue.resume();
    }

    const [counts, workerCount] = await Promise.all([
      this.qsarQueue.getJobCounts(),
      this.qsarQueue.getWorkersCount(),
    ]);

    this.logger.log(
      `QSAR queue ready: workers=${workerCount}, counts=${JSON.stringify(counts)}`,
    );
  }
}
