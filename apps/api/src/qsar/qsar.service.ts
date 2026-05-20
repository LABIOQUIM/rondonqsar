import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, NotFoundException } from "@nestjs/common";
import { Queue } from "bullmq";
import * as fs from "fs";
import * as path from "path";

import type { User } from "../generated/prisma/client.js";

import { PrismaService } from "../prisma.service.js";
import {
  QSAR_QUEUE,
  type QsarFile,
  type QsarJobData,
  type QsarSubmissionDetails,
  type QsarSubmitResponse,
  type UserQsarSubmissionsResponse,
} from "./qsar.types.js";

type PaginationInput = {
  pageSize?: number | undefined;
  page?: number | undefined;
};

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

function normalizePagination({ pageSize, page }: PaginationInput) {
  const normalizedPageSize =
    Number.isInteger(pageSize) && pageSize && pageSize > 0
      ? Math.min(pageSize, MAX_PAGE_SIZE)
      : DEFAULT_PAGE_SIZE;
  const normalizedPage = Number.isInteger(page) && page && page > 0 ? page : 0;

  return {
    pageSize: normalizedPageSize,
    page: normalizedPage,
  };
}

@Injectable()
export class QsarService {
  constructor(
    @InjectQueue(QSAR_QUEUE) private qsarQueue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  async submit(
    file: Express.Multer.File,
    user: Pick<User, "id" | "username">,
  ): Promise<QsarSubmitResponse> {
    const qsarSubmission = (this.prisma as any).qsarSubmission;
    const submission = await qsarSubmission.create({
      data: {
        userId: user.id,
        originalName: file.originalname,
        filename: file.filename,
        filePath: file.path,
        status: "QUEUED",
      },
    });
    const submissionDir = path.join("/files", user.username, "qsar", submission.id);
    const finalFilePath = path.join(submissionDir, file.filename);

    fs.mkdirSync(submissionDir, { recursive: true });
    fs.renameSync(file.path, finalFilePath);

    const storedFile: QsarFile = {
      filename: file.filename,
      path: finalFilePath,
      originalName: file.originalname,
    };

    await qsarSubmission.update({
      where: { id: submission.id },
      data: {
        filename: storedFile.filename,
        filePath: storedFile.path,
      },
    });

    const job = await this.qsarQueue.add("calculate-qsar", {
      calculation: "qsar",
      submissionId: submission.id,
      file: storedFile,
      submittedAt: new Date().toISOString(),
    } satisfies QsarJobData);

    await qsarSubmission.update({
      where: { id: submission.id },
      data: {
        jobId: String(job.id),
      },
    });

    return {
      calculation: "qsar",
      submissionId: submission.id,
      jobId: String(job.id),
      status: "queued",
      file: storedFile,
    };
  }

  async findCurrentUser(
    userId: string,
    pagination: PaginationInput = {},
  ): Promise<UserQsarSubmissionsResponse> {
    const { pageSize, page } = normalizePagination(pagination);
    const where = { userId };

    const [records, total] = await Promise.all([
      (this.prisma as any).qsarSubmission.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: page * pageSize,
        take: pageSize,
        select: {
          id: true,
          originalName: true,
          status: true,
          jobId: true,
          errorMessage: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              plasmoResults: true,
              leishResults: true,
            },
          },
        },
      }),
      (this.prisma as any).qsarSubmission.count({ where }),
    ]);

    return {
      records: records.map(({ _count, ...submission }) => ({
        ...submission,
        plasmoResultCount: _count.plasmoResults,
        leishResultCount: _count.leishResults,
      })),
      total,
    };
  }

  async findCurrentUserSubmission(
    userId: string,
    submissionId: string,
  ): Promise<QsarSubmissionDetails> {
    const submission = await (this.prisma as any).qsarSubmission.findFirst({
      where: {
        id: submissionId,
        userId,
      },
      select: {
        id: true,
        originalName: true,
        status: true,
        jobId: true,
        errorMessage: true,
        createdAt: true,
        updatedAt: true,
        plasmoResults: {
          orderBy: {
            moleculeNumber: "asc",
          },
          select: {
            moleculeNumber: true,
            descriptorA: true,
            descriptorB: true,
            descriptorC: true,
            pec50: true,
            ec50: true,
          },
        },
        leishResults: {
          orderBy: {
            moleculeNumber: "asc",
          },
          select: {
            moleculeNumber: true,
            descriptorA: true,
            descriptorB: true,
            descriptorC: true,
            descriptorD: true,
            pec50: true,
            ec50: true,
          },
        },
        _count: {
          select: {
            plasmoResults: true,
            leishResults: true,
          },
        },
      },
    });

    if (!submission) {
      throw new NotFoundException("QSAR submission not found");
    }

    const { _count, ...details } = submission;

    return {
      ...details,
      plasmoResultCount: _count.plasmoResults,
      leishResultCount: _count.leishResults,
    };
  }
}
