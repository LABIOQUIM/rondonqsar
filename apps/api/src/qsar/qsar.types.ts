import type { Job } from "bullmq";

export const QSAR_QUEUE = "qsar";

export type QsarFile = {
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

export type LeishResultRow = PlasmoResultRow & {
  descriptorD: number;
};

export type QsarJobData = {
  calculation: "qsar";
  submissionId: string;
  file: QsarFile;
  submittedAt: string;
};

export type QsarSubmitResponse = {
  calculation: "qsar";
  submissionId: string;
  jobId: string;
  status: "queued";
  file: QsarFile;
};

export type QsarSubmissionSummary = {
  id: string;
  originalName: string;
  status: string;
  jobId: string | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date | null;
  plasmoResultCount: number;
  leishResultCount: number;
};

export type QsarSubmissionDetails = QsarSubmissionSummary & {
  plasmoResults: PlasmoResultRow[];
  leishResults: LeishResultRow[];
};

export type UserQsarSubmissionsResponse = {
  records: QsarSubmissionSummary[];
  total: number;
};

export type QsarJob = Job<QsarJobData>;
