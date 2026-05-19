import { InjectQueue } from "@nestjs/bullmq";
import { Injectable, NotFoundException } from "@nestjs/common";
import { Queue } from "bullmq";
import * as fs from "fs";
import * as path from "path";

import type { User } from "../generated/prisma/client.js";

import { PrismaService } from "../prisma.service.js";
import {
  PLASMO_QUEUE,
  type PlasmoJobData,
  type PlasmoFile,
  type PlasmoSubmitResponse,
  type PlasmoTaskDetails,
  type UserPlasmoTasksResponse,
} from "./plasmo.types.js";

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
export class PlasmoService {
  constructor(
    @InjectQueue(PLASMO_QUEUE) private plasmoQueue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  async submit(
    file: Express.Multer.File,
    user: Pick<User, "id" | "username">,
  ): Promise<PlasmoSubmitResponse> {
    const task = await this.prisma.plasmoTask.create({
      data: {
        userId: user.id,
        originalName: file.originalname,
        filename: file.filename,
        filePath: file.path,
        status: "QUEUED",
      },
    });
    const taskDir = path.join("/files", user.username, "plasmo", task.id);
    const finalFilePath = path.join(taskDir, file.filename);

    fs.mkdirSync(taskDir, { recursive: true });
    fs.renameSync(file.path, finalFilePath);

    const storedFile: PlasmoFile = {
      filename: file.filename,
      path: finalFilePath,
      originalName: file.originalname,
    };

    await this.prisma.plasmoTask.update({
      where: { id: task.id },
      data: {
        filename: storedFile.filename,
        filePath: storedFile.path,
      },
    });

    const job = await this.plasmoQueue.add("calculate-plasmo", {
      calculation: "plasmo",
      taskId: task.id,
      file: storedFile,
      submittedAt: new Date().toISOString(),
    } satisfies PlasmoJobData);

    await this.prisma.plasmoTask.update({
      where: { id: task.id },
      data: {
        jobId: String(job.id),
      },
    });

    return {
      calculation: "plasmo",
      taskId: task.id,
      jobId: String(job.id),
      status: "queued",
      file: storedFile,
    };
  }

  async findCurrentUser(
    userId: string,
    pagination: PaginationInput = {},
  ): Promise<UserPlasmoTasksResponse> {
    const { pageSize, page } = normalizePagination(pagination);
    const where = { userId };

    const [records, total] = await Promise.all([
      this.prisma.plasmoTask.findMany({
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
              results: true,
            },
          },
        },
      }),
      this.prisma.plasmoTask.count({ where }),
    ]);

    return {
      records: records.map(({ _count, ...task }) => ({
        ...task,
        resultCount: _count.results,
      })),
      total,
    };
  }

  async findCurrentUserTask(userId: string, taskId: string): Promise<PlasmoTaskDetails> {
    const task = await this.prisma.plasmoTask.findFirst({
      where: {
        id: taskId,
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
        results: {
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
        _count: {
          select: {
            results: true,
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException("Plasmo task not found");
    }

    const { _count, ...details } = task;

    return {
      ...details,
      resultCount: _count.results,
    };
  }
}
