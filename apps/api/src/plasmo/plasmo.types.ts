import type { Job } from "bullmq";

export const PLASMO_QUEUE = "plasmo";

export type PlasmoFile = {
  filename: string;
  path: string;
  originalName: string;
};

export type PlasmoJobData = {
  calculation: "plasmo";
  file: PlasmoFile;
  submittedAt: string;
};

export type PlasmoSubmitResponse = {
  calculation: "plasmo";
  jobId: string;
  status: "queued";
  file: PlasmoFile;
};

export type PlasmoJob = Job<PlasmoJobData>;

export function toPlasmoFile(file: Express.Multer.File): PlasmoFile {
  return {
    filename: file.filename,
    path: file.path,
    originalName: file.originalname,
  };
}
