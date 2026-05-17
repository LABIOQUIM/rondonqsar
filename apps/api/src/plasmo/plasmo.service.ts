import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { Queue } from "bullmq";

import {
  PLASMO_QUEUE,
  type PlasmoJobData,
  type PlasmoSubmitResponse,
  toPlasmoFile,
} from "./plasmo.types.js";

@Injectable()
export class PlasmoService {
  constructor(@InjectQueue(PLASMO_QUEUE) private plasmoQueue: Queue) {}

  async submit(file: Express.Multer.File): Promise<PlasmoSubmitResponse> {
    const storedFile = toPlasmoFile(file);
    const job = await this.plasmoQueue.add("calculate-plasmo", {
      calculation: "plasmo",
      file: storedFile,
      submittedAt: new Date().toISOString(),
    } satisfies PlasmoJobData);

    return {
      calculation: "plasmo",
      jobId: String(job.id),
      status: "queued",
      file: storedFile,
    };
  }
}
