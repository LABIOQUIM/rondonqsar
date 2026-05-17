import { Processor, WorkerHost } from "@nestjs/bullmq";

import { calculateLeish } from "./leish.calculation.js";
import { type LeishJob, LEISH_QUEUE } from "./leish.types.js";

@Processor(LEISH_QUEUE)
export class LeishConsumer extends WorkerHost {
  async process(job: LeishJob) {
    return calculateLeish(job.data);
  }
}
