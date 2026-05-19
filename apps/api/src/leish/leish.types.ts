import type { Job } from "bullmq";

export const LEISH_QUEUE = "leish";

export type LeishFile = {
  filename: string;
  path: string;
  originalName: string;
};

export type LeishJobData = {
  calculation: "leish";
  taskId: string;
  file: LeishFile;
  submittedAt: string;
};

export type LeishSubmitResponse = {
  calculation: "leish";
  taskId: string;
  jobId: string;
  status: "queued";
  file: LeishFile;
};

export type LeishResultRow = {
  moleculeNumber: number;
  descriptorA: number;
  descriptorB: number;
  descriptorC: number;
  descriptorD: number;
  pec50: number;
  ec50: number;
};

export type LeishTaskSummary = {
  id: string;
  originalName: string;
  status: string;
  jobId: string | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date | null;
  resultCount: number;
};

export type LeishTaskDetails = LeishTaskSummary & {
  results: LeishResultRow[];
};

export type UserLeishTasksResponse = {
  records: LeishTaskSummary[];
  total: number;
};

export type LeishJob = Job<LeishJobData>;

export function toLeishFile(file: Express.Multer.File): LeishFile {
  return {
    filename: file.filename,
    path: file.path,
    originalName: file.originalname,
  };
}
