import type { Job } from "bullmq";

export const LEISH_QUEUE = "leish";

export type LeishFile = {
  filename: string;
  path: string;
  originalName: string;
};

export type LeishJobData = {
  calculation: "leish";
  file: LeishFile;
  submittedAt: string;
};

export type LeishSubmitResponse = {
  calculation: "leish";
  jobId: string;
  status: "queued";
  file: LeishFile;
};

export type LeishJob = Job<LeishJobData>;

export function toLeishFile(file: Express.Multer.File): LeishFile {
  return {
    filename: file.filename,
    path: file.path,
    originalName: file.originalname,
  };
}
