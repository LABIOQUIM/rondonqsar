import { Processor, WorkerHost } from "@nestjs/bullmq";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

import { PrismaService } from "../prisma.service.js";
import { type PlasmoJob, type PlasmoResultRow, PLASMO_QUEUE } from "./plasmo.types.js";

type PlasmoCalculationResult = {
  calculation: "plasmo";
  taskId: string;
  file: PlasmoJob["data"]["file"];
  results: PlasmoResultRow[];
};

function isValidNumber(value: string): boolean {
  return /^[-+]?(\d+(\.\d*)?|\.\d+)([eE][-+]?\d+)?$/.test(value);
}

function calculateResultRow(line: string): PlasmoResultRow | null {
  const lineArr = line.split("\t");
  const moleculeNumber = lineArr[0];
  const valueA = lineArr[1];
  const valueB = lineArr[2];
  const valueC = lineArr[3];

  if (!moleculeNumber || !valueA || !valueB || !valueC) {
    return null;
  }

  if (
    !isValidNumber(moleculeNumber) ||
    !isValidNumber(valueA) ||
    !isValidNumber(valueB) ||
    !isValidNumber(valueC)
  ) {
    return null;
  }

  const A = parseFloat(valueA);
  const B = parseFloat(valueB);
  const C = parseFloat(valueC);

  const pec50 =
    55.8464453262526 * A +
    460.629869289697 * B +
    1576.39573192884 * C -
    1.9879494191188 * A ** 2 -
    22.9077094736772 * A * B -
    53.9227383846824 * A * C -
    39.8670687817909 * B ** 2 -
    1167.06893852196 * B * C -
    1428.25287851626 * C ** 2 +
    0.0256858679064252 * A ** 3 +
    0.864766589013676 * A ** 2 * B +
    1.2305514402288 * A ** 2 * C -
    3.65447333045831 * A * B ** 2 +
    15.5104088878442 * A * B * C +
    19.7110745910283 * A * C ** 2 +
    10.9912765200239 * B ** 3 +
    251.546923335286 * B ** 2 * C +
    985.496996913981 * B * C ** 2 +
    530.744373207641 * C ** 3 +
    0.000041787198663648 * A ** 4 -
    0.013567266110872 * A ** 3 * B -
    0.0169558830453452 * A ** 3 * C +
    0.0953162922602021 * A ** 2 * B ** 2 -
    0.0350116951897071 * A ** 2 * B * C +
    0.017519204634866 * A ** 2 * C ** 2 -
    0.317300303201679 * A * B ** 3 -
    0.804582936568995 * A * B ** 2 * C -
    7.91171045385113 * A * B * C ** 2 -
    4.02023508785023 * A * C ** 3 +
    0.676843423025609 * B ** 4 -
    12.6680357727857 * B ** 3 * C -
    144.091062037205 * B ** 2 * C ** 2 -
    206.849984324245 * B * C ** 3 -
    62.4840884569312 * C ** 4 -
    743.63518669;

  const ec50 = 10 ** (-pec50 + 6);

  return {
    moleculeNumber: Number.parseInt(moleculeNumber, 10),
    descriptorA: A,
    descriptorB: B,
    descriptorC: C,
    pec50,
    ec50,
  };
}

@Processor(PLASMO_QUEUE)
export class PlasmoConsumer extends WorkerHost {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: PlasmoJob): Promise<PlasmoCalculationResult> {
    const inputFilePath = job.data.file.path;
    const outputDir = path.dirname(inputFilePath);
    const outputFilePath = path.join(outputDir, "out.txt");
    const reportFilePath = path.join(outputDir, "report.txt");
    const isolatedDescriptorsPath = path.join(outputDir, "isolatedDescriptors.txt");

    await this.prisma.plasmoTask.update({
      where: { id: job.data.taskId },
      data: {
        status: "PROCESSING",
        errorMessage: null,
      },
    });

    try {
      execSync(`Mold2 -i ${inputFilePath} -o ${outputFilePath} -r ${reportFilePath}`);
      execSync(`cat ${outputFilePath} | cut -f 1,144,313,471 > ${isolatedDescriptorsPath}`);

      const isolatedDescriptorsRaw = fs.readFileSync(isolatedDescriptorsPath, "utf-8");
      const isolatedDescriptorsContent = isolatedDescriptorsRaw.split(/\r?\n/);
      const results = isolatedDescriptorsContent
        .slice(1, -1)
        .map(calculateResultRow)
        .filter((result): result is PlasmoResultRow => result !== null);

      await this.prisma.plasmoTask.update({
        where: { id: job.data.taskId },
        data: {
          outputPath: outputFilePath,
          reportPath: reportFilePath,
          isolatedDescriptorsPath,
        },
      });

      await this.prisma.plasmoResult.deleteMany({
        where: { taskId: job.data.taskId },
      });

      if (results.length > 0) {
        await this.prisma.plasmoResult.createMany({
          data: results.map((result) => ({
            taskId: job.data.taskId,
            moleculeNumber: result.moleculeNumber,
            descriptorA: result.descriptorA,
            descriptorB: result.descriptorB,
            descriptorC: result.descriptorC,
            pec50: result.pec50,
            ec50: result.ec50,
          })),
        });
      }

      await this.prisma.plasmoTask.update({
        where: { id: job.data.taskId },
        data: {
          status: "COMPLETED",
          errorMessage: null,
        },
      });

      return {
        calculation: "plasmo",
        taskId: job.data.taskId,
        file: job.data.file,
        results,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "plasmo-job-failed";

      await this.prisma.plasmoTask.update({
        where: { id: job.data.taskId },
        data: {
          status: "FAILED",
          errorMessage,
        },
      });

      throw error instanceof Error ? error : new Error(errorMessage);
    }
  }
}
