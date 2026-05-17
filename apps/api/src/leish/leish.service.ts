import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { Queue } from "bullmq";

import {
  LEISH_QUEUE,
  type LeishJobData,
  type LeishSubmitResponse,
  toLeishFile,
} from "./leish.types.js";

@Injectable()
export class LeishService {
  constructor(@InjectQueue(LEISH_QUEUE) private leishQueue: Queue) {}

  async submit(file: Express.Multer.File): Promise<LeishSubmitResponse> {
    const storedFile = toLeishFile(file);
    const job = await this.leishQueue.add("calculate-leish", {
      calculation: "leish",
      file: storedFile,
      submittedAt: new Date().toISOString(),
    } satisfies LeishJobData);

    return {
      calculation: "leish",
      jobId: String(job.id),
      status: "queued",
      file: storedFile,
    };
  }
}
