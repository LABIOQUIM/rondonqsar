import type { Job } from "bullmq";

export const PLASMO_QUEUE = "plasmo";

export type PlasmoFile = {
  filename: string;
  path: string;
  originalName: string;
};

export type PlasmoResultRow = {
  moleculeNumber: number;
  descriptorA: number;
  descriptorB: number;
  descriptorC: number;
  pec50: number;
  ec50: number;
};

export type PlasmoJobData = {
  calculation: "plasmo";
  taskId: string;
  file: PlasmoFile;
  submittedAt: string;
};

export type PlasmoSubmitResponse = {
  calculation: "plasmo";
  taskId: string;
  jobId: string;
  status: "queued";
  file: PlasmoFile;
};

export type PlasmoTaskSummary = {
  id: string;
  originalName: string;
  status: string;
  jobId: string | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date | null;
  resultCount: number;
};

export type PlasmoTaskDetails = PlasmoTaskSummary & {
  results: PlasmoResultRow[];
};

export type UserPlasmoTasksResponse = {
  records: PlasmoTaskSummary[];
  total: number;
};

export type PlasmoJob = Job<PlasmoJobData>;

export function toPlasmoFile(file: Express.Multer.File): PlasmoFile {
  return {
    filename: file.filename,
    path: file.path,
    originalName: file.originalname,
  };
}
