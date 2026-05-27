import type { Job } from "bullmq";

import { OnWorkerEvent, Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

import { PrismaService } from "../prisma.service.js";
import {
  type LeishResultRow,
  type PlasmoResultRow,
  type QsarJob,
  QSAR_QUEUE,
} from "./qsar.types.js";

type QsarCalculationResult = {
  calculation: "qsar";
  submissionId: string;
  file: QsarJob["data"]["file"];
  plasmoResults: PlasmoResultRow[];
  leishResults: LeishResultRow[];
};

type PlasmoDescriptorPowers = readonly [number, number, number];
type LeishDescriptorPowers = readonly [number, number, number, number];
type DescriptorTerm<TPowers extends readonly number[]> = {
  coefficient: number;
  powers: TPowers;
};

function getWorkerConcurrency() {
  const concurrency = Number(process.env.QSAR_WORKER_CONCURRENCY ?? 1);

  return Number.isInteger(concurrency) && concurrency > 0 ? concurrency : 1;
}

const PLASMO_TERMS: Array<DescriptorTerm<PlasmoDescriptorPowers>> = [
  { coefficient: -743.63518669, powers: [0, 0, 0] },
  { coefficient: 55.8464453262526, powers: [1, 0, 0] },
  { coefficient: 460.629869289697, powers: [0, 1, 0] },
  { coefficient: 1576.39573192884, powers: [0, 0, 1] },
  { coefficient: -1.9879494191188, powers: [2, 0, 0] },
  { coefficient: -22.9077094736772, powers: [1, 1, 0] },
  { coefficient: -53.9227383846824, powers: [1, 0, 1] },
  { coefficient: -39.8670687817909, powers: [0, 2, 0] },
  { coefficient: -1167.06893852196, powers: [0, 1, 1] },
  { coefficient: -1428.25287851626, powers: [0, 0, 2] },
  { coefficient: 0.0256858679064252, powers: [3, 0, 0] },
  { coefficient: 0.864766589013676, powers: [2, 1, 0] },
  { coefficient: 1.2305514402288, powers: [2, 0, 1] },
  { coefficient: -3.65447333045831, powers: [1, 2, 0] },
  { coefficient: 15.5104088878442, powers: [1, 1, 1] },
  { coefficient: 19.7110745910283, powers: [1, 0, 2] },
  { coefficient: 10.9912765200239, powers: [0, 3, 0] },
  { coefficient: 251.546923335286, powers: [0, 2, 1] },
  { coefficient: 985.496996913981, powers: [0, 1, 2] },
  { coefficient: 530.744373207641, powers: [0, 0, 3] },
  { coefficient: 0.000041787198663648, powers: [4, 0, 0] },
  { coefficient: -0.013567266110872, powers: [3, 1, 0] },
  { coefficient: -0.0169558830453452, powers: [3, 0, 1] },
  { coefficient: 0.0953162922602021, powers: [2, 2, 0] },
  { coefficient: -0.0350116951897071, powers: [2, 1, 1] },
  { coefficient: 0.017519204634866, powers: [2, 0, 2] },
  { coefficient: -0.317300303201679, powers: [1, 3, 0] },
  { coefficient: -0.804582936568995, powers: [1, 2, 1] },
  { coefficient: -7.91171045385113, powers: [1, 1, 2] },
  { coefficient: -4.02023508785023, powers: [1, 0, 3] },
  { coefficient: 0.676843423025609, powers: [0, 4, 0] },
  { coefficient: -12.6680357727857, powers: [0, 3, 1] },
  { coefficient: -144.091062037205, powers: [0, 2, 2] },
  { coefficient: -206.849984324245, powers: [0, 1, 3] },
  { coefficient: -62.4840884569312, powers: [0, 0, 4] },
];

const LEISH_TERMS: Array<DescriptorTerm<LeishDescriptorPowers>> = [
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

function calculatePec50FromTerms<TPowers extends readonly number[]>(
  values: readonly number[],
  terms: Array<DescriptorTerm<TPowers>>,
): number {
  return terms.reduce(
    (total, term) =>
      total +
      term.coefficient *
        term.powers.reduce((product, power, index) => product * values[index] ** power, 1),
    0,
  );
}

function calculatePlasmoResultRow(line: string): PlasmoResultRow | null {
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
  const pec50 = calculatePec50FromTerms([A, B, C], PLASMO_TERMS);

  return {
    moleculeNumber: Number.parseInt(moleculeNumber, 10),
    descriptorA: A,
    descriptorB: B,
    descriptorC: C,
    pec50,
    ec50: 10 ** (-pec50 + 6),
  };
}

function calculateLeishPec50(d237: number, d215: number, d466: number, d590: number): number {
  return calculatePec50FromTerms([d237, d215, d466, d590], LEISH_TERMS);
}

function calculateLeishResultRow(line: string): LeishResultRow | null {
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
  const pec50 = calculateLeishPec50(A, B, C, D);

  return {
    moleculeNumber: Number.parseInt(moleculeNumber, 10),
    descriptorA: A,
    descriptorB: B,
    descriptorC: C,
    descriptorD: D,
    pec50,
    ec50: 10 ** -pec50,
  };
}

@Processor(QSAR_QUEUE, { concurrency: getWorkerConcurrency() })
export class QsarConsumer extends WorkerHost {
  private readonly logger = new Logger(QsarConsumer.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  @OnWorkerEvent("ready")
  onReady() {
    this.logger.log("QSAR worker ready.");
  }

  @OnWorkerEvent("active")
  onActive(job: Job<QsarJob["data"]>) {
    this.logger.log(`QSAR job ${job.id} active for submission ${job.data.submissionId}.`);
  }

  @OnWorkerEvent("completed")
  onCompleted(job: Job<QsarJob["data"]>) {
    this.logger.log(`QSAR job ${job.id} completed for submission ${job.data.submissionId}.`);
  }

  @OnWorkerEvent("failed")
  onFailed(job: Job<QsarJob["data"]> | undefined, error: Error) {
    this.logger.error(
      `QSAR job ${job?.id ?? "unknown"} failed for submission ${job?.data.submissionId ?? "unknown"}: ${error.message}`,
      error.stack,
    );
  }

  @OnWorkerEvent("error")
  onError(error: Error) {
    this.logger.error(`QSAR worker error: ${error.message}`, error.stack);
  }

  @OnWorkerEvent("stalled")
  onStalled(jobId: string) {
    this.logger.warn(`QSAR job ${jobId} stalled and was returned to the queue.`);
  }

  @OnWorkerEvent("lockRenewalFailed")
  onLockRenewalFailed(jobIds: string[]) {
    this.logger.error(`QSAR worker failed to renew locks for jobs: ${jobIds.join(", ")}`);
  }

  async process(job: QsarJob): Promise<QsarCalculationResult> {
    const inputFilePath = job.data.file.path;
    const outputDir = path.dirname(inputFilePath);
    const outputFilePath = path.join(outputDir, "out.txt");
    const reportFilePath = path.join(outputDir, "report.txt");
    const plasmoIsolatedDescriptorsPath = path.join(outputDir, "plasmoIsolatedDescriptors.txt");
    const leishIsolatedDescriptorsPath = path.join(outputDir, "leishIsolatedDescriptors.txt");

    const prisma = this.prisma as any;

    await prisma.qsarSubmission.update({
      where: { id: job.data.submissionId },
      data: {
        status: "PROCESSING",
        errorMessage: null,
      },
    });

    try {
      execSync(`Mold2 -i ${inputFilePath} -o ${outputFilePath} -r ${reportFilePath}`);
      execSync(
        `awk -F '\\t' 'BEGIN {OFS="\\t"} {print $1,$144,$313,$471}' ${outputFilePath} > ${plasmoIsolatedDescriptorsPath}`,
      );
      execSync(
        `awk -F '\\t' 'BEGIN {OFS="\\t"} {print $1,$238,$216,$467,$591}' ${outputFilePath} > ${leishIsolatedDescriptorsPath}`,
      );

      const plasmoDescriptorsRaw = fs.readFileSync(plasmoIsolatedDescriptorsPath, "utf-8");
      const leishDescriptorsRaw = fs.readFileSync(leishIsolatedDescriptorsPath, "utf-8");
      const plasmoResults = plasmoDescriptorsRaw
        .split(/\r?\n/)
        .slice(1, -1)
        .map(calculatePlasmoResultRow)
        .filter((result): result is PlasmoResultRow => result !== null);
      const leishResults = leishDescriptorsRaw
        .split(/\r?\n/)
        .slice(1, -1)
        .map(calculateLeishResultRow)
        .filter((result): result is LeishResultRow => result !== null);

      await prisma.qsarSubmission.update({
        where: { id: job.data.submissionId },
        data: {
          outputPath: outputFilePath,
          reportPath: reportFilePath,
          plasmoIsolatedDescriptorsPath,
          leishIsolatedDescriptorsPath,
        },
      });

      const operations = [
        prisma.plasmoResult.deleteMany({
          where: { submissionId: job.data.submissionId },
        }),
        prisma.leishResult.deleteMany({
          where: { submissionId: job.data.submissionId },
        }),
      ];

      if (plasmoResults.length > 0) {
        operations.push(
          prisma.plasmoResult.createMany({
            data: plasmoResults.map((result) => ({
              submissionId: job.data.submissionId,
              moleculeNumber: result.moleculeNumber,
              descriptorA: result.descriptorA,
              descriptorB: result.descriptorB,
              descriptorC: result.descriptorC,
              pec50: result.pec50,
              ec50: result.ec50,
            })),
          }),
        );
      }

      if (leishResults.length > 0) {
        operations.push(
          prisma.leishResult.createMany({
            data: leishResults.map((result) => ({
              submissionId: job.data.submissionId,
              moleculeNumber: result.moleculeNumber,
              descriptorA: result.descriptorA,
              descriptorB: result.descriptorB,
              descriptorC: result.descriptorC,
              descriptorD: result.descriptorD,
              pec50: result.pec50,
              ec50: result.ec50,
            })),
          }),
        );
      }

      await prisma.$transaction(operations);

      await prisma.qsarSubmission.update({
        where: { id: job.data.submissionId },
        data: {
          status: "COMPLETED",
          errorMessage: null,
        },
      });

      return {
        calculation: "qsar",
        submissionId: job.data.submissionId,
        file: job.data.file,
        plasmoResults,
        leishResults,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "qsar-job-failed";

      await prisma.qsarSubmission.update({
        where: { id: job.data.submissionId },
        data: {
          status: "FAILED",
          errorMessage,
        },
      });

      throw error instanceof Error ? error : new Error(errorMessage);
    }
  }
}
