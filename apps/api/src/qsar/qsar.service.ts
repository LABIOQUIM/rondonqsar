import { InjectQueue } from "@nestjs/bullmq";
import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Job, Queue } from "bullmq";
import * as fs from "fs";
import * as path from "path";

import type { User } from "../generated/prisma/client.js";

import { PrismaService } from "../prisma.service.js";
import {
  type AdminQsarSubmissionDetails,
  type AdminQsarSubmissionsResponse,
  QSAR_QUEUE,
  type QsarFile,
  type QsarJobData,
  type QsarQueueDiagnostics,
  type QsarQueueDiagnosticsPagination,
  type QsarQueueJobSummary,
  type QsarRequeueResponse,
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
const QUEUE_DIAGNOSTICS_PAGE_SIZE = 5;

const qsarSubmissionCountSelect = {
  _count: {
    select: {
      plasmoResults: true,
      leishResults: true,
    },
  },
} as const;

const qsarSubmissionSummarySelect = {
  id: true,
  originalName: true,
  status: true,
  jobId: true,
  errorMessage: true,
  createdAt: true,
  updatedAt: true,
  ...qsarSubmissionCountSelect,
} as const;

const qsarSubmissionDetailsSelect = {
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
  ...qsarSubmissionCountSelect,
} as const;

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

function normalizeQueuePage(page: number | undefined) {
  return Number.isInteger(page) && page && page > 0 ? page : 0;
}

function getQueuePageBounds(page: number | undefined) {
  const normalizedPage = normalizeQueuePage(page);
  const start = normalizedPage * QUEUE_DIAGNOSTICS_PAGE_SIZE;

  return {
    start,
    end: start + QUEUE_DIAGNOSTICS_PAGE_SIZE - 1,
    page: normalizedPage,
  };
}

function mapSubmissionCounts<
  TSubmission extends { _count: { plasmoResults: number; leishResults: number } },
>(submission: TSubmission) {
  const { _count, ...details } = submission;

  return {
    ...details,
    plasmoResultCount: _count.plasmoResults,
    leishResultCount: _count.leishResults,
  };
}

type RawSubmissionCounts = {
  _count: {
    plasmoResults: number;
    leishResults: number;
  };
};

type RawSubmissionSummary = {
  id: string;
  originalName: string;
  status: string;
  jobId: string | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date | null;
} & RawSubmissionCounts;

type RawSubmissionDetails = RawSubmissionSummary & {
  plasmoResults: QsarSubmissionDetails["plasmoResults"];
  leishResults: QsarSubmissionDetails["leishResults"];
};

type RawAdminSubmissionSummary = RawSubmissionSummary & {
  userId: string;
  user: {
    username: string;
  };
};

type RawAdminSubmissionDetails = RawSubmissionDetails & {
  userId: string;
  user: {
    username: string;
  };
};

type RawQueuedSubmissionDiagnostic = {
  id: string;
  user: {
    username: string;
  };
  originalName: string;
  jobId: string | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date | null;
};

type RawRequeueSubmission = {
  id: string;
  originalName: string;
  filename: string;
  filePath: string;
  status: string;
};

async function mapQueueJob(job: Job): Promise<QsarQueueJobSummary> {
  return {
    id: job.id,
    username: null,
    name: job.name,
    state: await job.getState(),
    submissionId:
      typeof job.data === "object" &&
      job.data !== null &&
      "submissionId" in job.data &&
      typeof job.data.submissionId === "string"
        ? job.data.submissionId
        : null,
    attemptsMade: job.attemptsMade,
    failedReason: job.failedReason ?? null,
    timestamp: job.timestamp,
    processedOn: job.processedOn,
    finishedOn: job.finishedOn,
  };
}

async function addQueueJobUsernames(
  prisma: PrismaService,
  jobs: QsarQueueJobSummary[],
): Promise<QsarQueueJobSummary[]> {
  const submissionIds = jobs
    .map((job) => job.submissionId)
    .filter((submissionId): submissionId is string => typeof submissionId === "string");

  if (submissionIds.length === 0) return jobs;

  const submissions = (await (prisma as any).qsarSubmission.findMany({
    where: {
      id: {
        in: submissionIds,
      },
    },
    select: {
      id: true,
      user: {
        select: {
          username: true,
        },
      },
    },
  })) as { id: string; user: { username: string } }[];

  const usernamesBySubmissionId = new Map(
    submissions.map((submission) => [submission.id, submission.user.username]),
  );

  return jobs.map((job) => ({
    ...job,
    username: job.submissionId ? (usernamesBySubmissionId.get(job.submissionId) ?? null) : null,
  }));
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

  async getQueueDiagnostics(
    pagination: QsarQueueDiagnosticsPagination = {},
  ): Promise<QsarQueueDiagnostics> {
    const waitingPage = getQueuePageBounds(pagination.waitingPage);
    const activePage = getQueuePageBounds(pagination.activePage);
    const failedPage = getQueuePageBounds(pagination.failedPage);
    const queuedPage = getQueuePageBounds(pagination.queuedPage);

    const [
      counts,
      paused,
      workerCount,
      waitingJobs,
      activeJobs,
      failedJobs,
      queuedSubmissions,
      queuedSubmissionsTotal,
    ] = await Promise.all([
      this.qsarQueue.getJobCounts(),
      this.qsarQueue.isPaused(),
      this.qsarQueue.getWorkersCount(),
      this.qsarQueue.getJobs("waiting", waitingPage.start, waitingPage.end, false),
      this.qsarQueue.getJobs("active", activePage.start, activePage.end, false),
      this.qsarQueue.getJobs("failed", failedPage.start, failedPage.end, false),
      (this.prisma as any).qsarSubmission.findMany({
        where: { status: "QUEUED" },
        orderBy: { createdAt: "desc" },
        skip: queuedPage.start,
        take: QUEUE_DIAGNOSTICS_PAGE_SIZE,
        select: {
          id: true,
          user: {
            select: {
              username: true,
            },
          },
          originalName: true,
          jobId: true,
          errorMessage: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      (this.prisma as any).qsarSubmission.count({
        where: { status: "QUEUED" },
      }),
    ]);
    const [mappedWaitingJobs, mappedActiveJobs, mappedFailedJobs] = await Promise.all([
      Promise.all(waitingJobs.map((job) => mapQueueJob(job))).then((jobs) =>
        addQueueJobUsernames(this.prisma, jobs),
      ),
      Promise.all(activeJobs.map((job) => mapQueueJob(job))).then((jobs) =>
        addQueueJobUsernames(this.prisma, jobs),
      ),
      Promise.all(failedJobs.map((job) => mapQueueJob(job))).then((jobs) =>
        addQueueJobUsernames(this.prisma, jobs),
      ),
    ]);

    return {
      counts,
      paused,
      workerCount,
      recentJobs: {
        waiting: {
          records: mappedWaitingJobs,
          total: counts.waiting ?? 0,
        },
        active: {
          records: mappedActiveJobs,
          total: counts.active ?? 0,
        },
        failed: {
          records: mappedFailedJobs,
          total: counts.failed ?? 0,
        },
      },
      queuedSubmissions: {
        records: await Promise.all(
          (queuedSubmissions as RawQueuedSubmissionDiagnostic[]).map(async (submission) => {
            const { user, ...submissionData } = submission;

            return {
              ...submissionData,
              username: user.username,
              redisState: submission.jobId
                ? await this.qsarQueue.getJobState(submission.jobId)
                : null,
            };
          }),
        ),
        total: queuedSubmissionsTotal,
      },
    };
  }

  async requeueAdminSubmission(submissionId: string): Promise<QsarRequeueResponse> {
    const submission = (await (this.prisma as any).qsarSubmission.findFirst({
      where: { id: submissionId },
      select: {
        id: true,
        originalName: true,
        filename: true,
        filePath: true,
        status: true,
      },
    })) as RawRequeueSubmission | null;

    if (!submission) {
      throw new NotFoundException("QSAR submission not found");
    }

    if (submission.status !== "QUEUED" && submission.status !== "FAILED") {
      throw new BadRequestException("Only queued or failed QSAR submissions can be requeued");
    }

    if (!fs.existsSync(submission.filePath)) {
      throw new BadRequestException("QSAR input file is missing and cannot be requeued");
    }

    const storedFile: QsarFile = {
      filename: submission.filename,
      path: submission.filePath,
      originalName: submission.originalName,
    };

    const job = await this.qsarQueue.add("calculate-qsar", {
      calculation: "qsar",
      submissionId: submission.id,
      file: storedFile,
      submittedAt: new Date().toISOString(),
    } satisfies QsarJobData);

    await (this.prisma as any).qsarSubmission.update({
      where: { id: submission.id },
      data: {
        status: "QUEUED",
        jobId: String(job.id),
        errorMessage: null,
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
        select: qsarSubmissionSummarySelect,
      }),
      (this.prisma as any).qsarSubmission.count({ where }),
    ]);

    return {
      records: (records as RawSubmissionSummary[]).map((record) => mapSubmissionCounts(record)),
      total,
    };
  }

  async findAdmin(pagination: PaginationInput = {}): Promise<AdminQsarSubmissionsResponse> {
    const { pageSize, page } = normalizePagination(pagination);

    const [records, total] = await Promise.all([
      (this.prisma as any).qsarSubmission.findMany({
        orderBy: { createdAt: "desc" },
        skip: page * pageSize,
        take: pageSize,
        select: {
          ...qsarSubmissionSummarySelect,
          userId: true,
          user: {
            select: {
              username: true,
            },
          },
        },
      }),
      (this.prisma as any).qsarSubmission.count(),
    ]);

    return {
      records: (records as RawAdminSubmissionSummary[]).map((record) => {
        const { user, ...submission } = record;

        return {
          ...mapSubmissionCounts(submission),
          username: user.username,
        };
      }),
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
      select: qsarSubmissionDetailsSelect,
    });

    if (!submission) {
      throw new NotFoundException("QSAR submission not found");
    }

    return mapSubmissionCounts(submission as RawSubmissionDetails);
  }

  async findAdminSubmission(submissionId: string): Promise<AdminQsarSubmissionDetails> {
    const submission = await (this.prisma as any).qsarSubmission.findFirst({
      where: {
        id: submissionId,
      },
      select: {
        ...qsarSubmissionDetailsSelect,
        userId: true,
        user: {
          select: {
            username: true,
          },
        },
      },
    });

    if (!submission) {
      throw new NotFoundException("QSAR submission not found");
    }

    const { user, ...details } = submission as RawAdminSubmissionDetails;

    return {
      ...mapSubmissionCounts(details),
      username: user.username,
    };
  }
}
