import { Processor, WorkerHost } from "@nestjs/bullmq";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

import { PrismaService } from "../prisma.service.js";
import { type LeishJob, type LeishResultRow, LEISH_QUEUE } from "./leish.types.js";

type LeishCalculationResult = {
  calculation: "leish";
  taskId: string;
  file: LeishJob["data"]["file"];
  results: LeishResultRow[];
};

type DescriptorPowers = readonly [number, number, number, number];

const LEISH_TERMS: Array<{ coefficient: number; powers: DescriptorPowers }> = [
  { coefficient: -2618.81325553337, powers: [0, 0, 0, 0] },
  { coefficient: 46.4128021, powers: [1, 0, 0, 0] },
  { coefficient: -492.128261, powers: [0, 1, 0, 0] },
  { coefficient: 2368.8266, powers: [0, 0, 1, 0] },
  { coefficient: 3231.50612, powers: [0, 0, 0, 1] },
  { coefficient: 3.86386082, powers: [2, 0, 0, 0] },
  { coefficient: 2.52971327, powers: [1, 1, 0, 0] },
  { coefficient: -68.830108, powers: [1, 0, 1, 0] },
  { coefficient: -38.342479, powers: [1, 0, 0, 1] },
  { coefficient: -12.0009575, powers: [0, 2, 0, 0] },
  { coefficient: 180.956586, powers: [0, 1, 1, 0] },
  { coefficient: 423.104367, powers: [0, 1, 0, 1] },
  { coefficient: -415.070726, powers: [0, 0, 2, 0] },
  { coefficient: -2056.01531, powers: [0, 0, 1, 1] },
  { coefficient: -1486.6977, powers: [0, 0, 0, 2] },
  { coefficient: -0.036186975, powers: [3, 0, 0, 0] },
  { coefficient: 0.132688249, powers: [2, 1, 0, 0] },
  { coefficient: 0.594787395, powers: [2, 0, 1, 0] },
  { coefficient: -2.62267181, powers: [2, 0, 0, 1] },
  { coefficient: 0.232337951, powers: [1, 2, 0, 0] },
  { coefficient: -10.7757855, powers: [1, 1, 1, 0] },
  { coefficient: 0.0347068768, powers: [1, 1, 0, 1] },
  { coefficient: 82.0481142, powers: [1, 0, 2, 0] },
  { coefficient: 19.9083183, powers: [1, 0, 1, 1] },
  { coefficient: 11.9456529, powers: [1, 0, 0, 2] },
  { coefficient: -0.432916836, powers: [0, 3, 0, 0] },
  { coefficient: 15.8013058, powers: [0, 2, 1, 0] },
  { coefficient: 4.82025565, powers: [0, 2, 0, 1] },
  { coefficient: -14.7019288, powers: [0, 1, 2, 0] },
  { coefficient: -124.160012, powers: [0, 1, 1, 1] },
  { coefficient: -116.611812, powers: [0, 1, 0, 2] },
  { coefficient: -301.019188, powers: [0, 0, 3, 0] },
  { coefficient: 323.373971, powers: [0, 0, 2, 1] },
  { coefficient: 597.784652, powers: [0, 0, 1, 2] },
  { coefficient: 299.477768, powers: [0, 0, 0, 3] },
  { coefficient: 0.000073798642, powers: [4, 0, 0, 0] },
  { coefficient: -0.00137054303, powers: [3, 1, 0, 0] },
  { coefficient: 0.000328100883, powers: [3, 0, 1, 0] },
  { coefficient: 0.0132745566, powers: [3, 0, 0, 1] },
  { coefficient: 0.00406959907, powers: [2, 2, 0, 0] },
  { coefficient: -0.000299687387, powers: [2, 1, 1, 0] },
  { coefficient: -0.0485443269, powers: [2, 1, 0, 1] },
  { coefficient: -1.29464048, powers: [2, 0, 2, 0] },
  { coefficient: 0.394568526, powers: [2, 0, 1, 1] },
  { coefficient: 0.378440393, powers: [2, 0, 0, 2] },
  { coefficient: -0.0008646251, powers: [1, 3, 0, 0] },
  { coefficient: -0.254397242, powers: [1, 2, 1, 0] },
  { coefficient: -0.0188761594, powers: [1, 2, 0, 1] },
  { coefficient: 5.01771654, powers: [1, 1, 2, 0] },
  { coefficient: 1.88435043, powers: [1, 1, 1, 1] },
  { coefficient: -0.176895415, powers: [1, 1, 0, 2] },
  { coefficient: -9.59534147, powers: [1, 0, 3, 0] },
  { coefficient: -21.5677374, powers: [1, 0, 2, 1] },
  { coefficient: -0.369682623, powers: [1, 0, 1, 2] },
  { coefficient: -1.29614468, powers: [1, 0, 0, 3] },
  { coefficient: 0.000607503197, powers: [0, 4, 0, 0] },
  { coefficient: 0.217590239, powers: [0, 3, 1, 0] },
  { coefficient: 0.0669608098, powers: [0, 3, 0, 1] },
  { coefficient: -2.87263356, powers: [0, 2, 2, 0] },
  { coefficient: -3.92981616, powers: [0, 2, 1, 1] },
  { coefficient: -0.337954693, powers: [0, 2, 0, 2] },
  { coefficient: -21.2192781, powers: [0, 1, 3, 0] },
  { coefficient: 16.0386698, powers: [0, 1, 2, 1] },
  { coefficient: 18.5244204, powers: [0, 1, 1, 2] },
  { coefficient: 10.3053126, powers: [0, 1, 0, 3] },
  { coefficient: 46.5510168, powers: [0, 0, 4, 0] },
  { coefficient: 100.57282, powers: [0, 0, 3, 1] },
  { coefficient: -71.9503864, powers: [0, 0, 2, 2] },
  { coefficient: -55.5536564, powers: [0, 0, 1, 3] },
  { coefficient: -22.2857711, powers: [0, 0, 0, 4] },
];

function isValidNumber(value: string): boolean {
  return /^[-+]?(\d+(\.\d*)?|\.\d+)([eE][-+]?\d+)?$/.test(value);
}

function calculatePec50(d237: number, d215: number, d466: number, d590: number): number {
  const values = [d237, d215, d466, d590] as const;

  return LEISH_TERMS.reduce(
    (total, term) =>
      total +
      term.coefficient *
        term.powers.reduce((product, power, index) => product * values[index] ** power, 1),
    0,
  );
}

function calculateResultRow(line: string): LeishResultRow | null {
  const lineArr = line.split("\t");
  const moleculeNumber = lineArr[0];
  const valueA = lineArr[1];
  const valueB = lineArr[2];
  const valueC = lineArr[3];
  const valueD = lineArr[4];

  if (!moleculeNumber || !valueA || !valueB || !valueC || !valueD) {
    return null;
  }

  if (
    !isValidNumber(moleculeNumber) ||
    !isValidNumber(valueA) ||
    !isValidNumber(valueB) ||
    !isValidNumber(valueC) ||
    !isValidNumber(valueD)
  ) {
    return null;
  }

  const A = parseFloat(valueA);
  const B = parseFloat(valueB);
  const C = parseFloat(valueC);
  const D = parseFloat(valueD);

  const pec50 = calculatePec50(A, B, C, D);
  const ec50 = 10 ** (-pec50 + 6);

  return {
    moleculeNumber: Number.parseInt(moleculeNumber, 10),
    descriptorA: A,
    descriptorB: B,
    descriptorC: C,
    descriptorD: D,
    pec50,
    ec50,
  };
}

@Processor(LEISH_QUEUE)
export class LeishConsumer extends WorkerHost {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: LeishJob): Promise<LeishCalculationResult> {
    const inputFilePath = job.data.file.path;
    const outputDir = path.dirname(inputFilePath);
    const outputFilePath = path.join(outputDir, "out.txt");
    const reportFilePath = path.join(outputDir, "report.txt");
    const isolatedDescriptorsPath = path.join(outputDir, "isolatedDescriptors.txt");

    await this.prisma.leishTask.update({
      where: { id: job.data.taskId },
      data: {
        status: "PROCESSING",
        errorMessage: null,
      },
    });

    try {
      execSync(`Mold2 -i ${inputFilePath} -o ${outputFilePath} -r ${reportFilePath}`);
      execSync(
        `awk -F '\\t' 'BEGIN {OFS="\\t"} {print $1,$238,$216,$467,$591}' ${outputFilePath} > ${isolatedDescriptorsPath}`,
      );

      const isolatedDescriptorsRaw = fs.readFileSync(isolatedDescriptorsPath, "utf-8");
      const isolatedDescriptorsContent = isolatedDescriptorsRaw.split(/\r?\n/);
      const results = isolatedDescriptorsContent
        .slice(1, -1)
        .map(calculateResultRow)
        .filter((result): result is LeishResultRow => result !== null);

      await this.prisma.leishTask.update({
        where: { id: job.data.taskId },
        data: {
          outputPath: outputFilePath,
          reportPath: reportFilePath,
          isolatedDescriptorsPath,
        },
      });

      await this.prisma.leishResult.deleteMany({
        where: { taskId: job.data.taskId },
      });

      if (results.length > 0) {
        await this.prisma.leishResult.createMany({
          data: results.map((result) => ({
            taskId: job.data.taskId,
            moleculeNumber: result.moleculeNumber,
            descriptorA: result.descriptorA,
            descriptorB: result.descriptorB,
            descriptorC: result.descriptorC,
            descriptorD: result.descriptorD,
            pec50: result.pec50,
            ec50: result.ec50,
          })),
        });
      }

      await this.prisma.leishTask.update({
        where: { id: job.data.taskId },
        data: {
          status: "COMPLETED",
          errorMessage: null,
        },
      });

      return {
        calculation: "leish",
        taskId: job.data.taskId,
        file: job.data.file,
        results,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "leish-job-failed";

      await this.prisma.leishTask.update({
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
