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

export type QsarQueueJobSummary = {
  id: string | undefined;
  name: string;
  state: string;
  submissionId: string | null;
  attemptsMade: number;
  failedReason: string | null;
  timestamp: number;
  processedOn: number | undefined;
  finishedOn: number | undefined;
};

export type QsarQueuedSubmissionDiagnostic = {
  id: string;
  originalName: string;
  jobId: string | null;
  redisState: string | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date | null;
};

export type PaginatedRecords<TRecord> = {
  records: TRecord[];
  total: number;
};

export type QsarQueueDiagnosticsPagination = {
  waitingPage?: number | undefined;
  activePage?: number | undefined;
  failedPage?: number | undefined;
  queuedPage?: number | undefined;
};

export type QsarQueueDiagnostics = {
  counts: Record<string, number>;
  paused: boolean;
  workerCount: number;
  recentJobs: {
    waiting: PaginatedRecords<QsarQueueJobSummary>;
    active: PaginatedRecords<QsarQueueJobSummary>;
    failed: PaginatedRecords<QsarQueueJobSummary>;
  };
  queuedSubmissions: PaginatedRecords<QsarQueuedSubmissionDiagnostic>;
};

export type QsarRequeueResponse = QsarSubmitResponse;

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

export type AdminQsarSubmissionSummary = QsarSubmissionSummary & {
  userId: string;
  username: string;
};

export type QsarSubmissionDetails = QsarSubmissionSummary & {
  plasmoResults: PlasmoResultRow[];
  leishResults: LeishResultRow[];
};

export type AdminQsarSubmissionDetails = QsarSubmissionDetails & {
  userId: string;
  username: string;
};

export type UserQsarSubmissionsResponse = {
  records: QsarSubmissionSummary[];
  total: number;
};

export type AdminQsarSubmissionsResponse = {
  records: AdminQsarSubmissionSummary[];
  total: number;
};

export type QsarJob = Job<QsarJobData>;
