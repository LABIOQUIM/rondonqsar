import { Processor, WorkerHost } from "@nestjs/bullmq";

import { calculatePlasmo } from "./plasmo.calculation.js";
import { type PlasmoJob, PLASMO_QUEUE } from "./plasmo.types.js";

@Processor(PLASMO_QUEUE)
export class PlasmoConsumer extends WorkerHost {
  async process(job: PlasmoJob) {
    return calculatePlasmo(job.data);
  }
}
