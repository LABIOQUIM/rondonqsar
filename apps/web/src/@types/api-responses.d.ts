export {};

declare global {
  type QsarSubmissionSummary = {
    id: string;
    originalName: string;
    status: QSAR_SUBMISSION_STATUS;
    jobId: string | null;
    errorMessage: string | null;
    createdAt: string;
    updatedAt: string | null;
    plasmoResultCount: number;
    leishResultCount: number;
  };

  type UserQsarSubmissions = {
    records: QsarSubmissionSummary[];
    total: number;
  };

  type AdminQsarSubmissionSummary = QsarSubmissionSummary & {
    userId: string;
    username: string;
  };

  type AdminQsarSubmissions = {
    records: AdminQsarSubmissionSummary[];
    total: number;
  };

  type PlasmoResultRow = {
    moleculeNumber: number;
    descriptorA: number;
    descriptorB: number;
    descriptorC: number;
    pec50: number;
    ec50: number;
  };

  type LeishResultRow = {
    moleculeNumber: number;
    descriptorA: number;
    descriptorB: number;
    descriptorC: number;
    descriptorD: number;
    pec50: number;
    ec50: number;
  };

  type QsarSubmissionDetails = QsarSubmissionSummary & {
    plasmoResults: PlasmoResultRow[];
    leishResults: LeishResultRow[];
  };

  type AdminQsarSubmissionDetails = QsarSubmissionDetails & {
    userId: string;
    username: string;
  };

  type QsarSubmitResponse = {
    calculation: "qsar";
    submissionId: string;
    jobId: string;
    status: "queued";
    file: {
      filename: string;
      path: string;
      originalName: string;
    };
  };

  type SystemInfo = {
    cpu: {
      brand: string;
      vendor: string;
      cores: number;
      physicalCores: number;
    };
    load: {
      current: number;
      average: number;
    };
    mem: {
      total: number;
      used: number;
    };
    fs: {
      size: number;
      used: number;
      available: number;
    };
  };

  type QsarQueueJobSummary = {
    id?: string;
    username: string | null;
    name: string;
    state: string;
    submissionId: string | null;
    attemptsMade: number;
    failedReason: string | null;
    timestamp: number;
    processedOn?: number;
    finishedOn?: number;
  };

  type QsarQueuedSubmissionDiagnostic = {
    id: string;
    username: string;
    originalName: string;
    jobId: string | null;
    redisState: string | null;
    errorMessage: string | null;
    createdAt: string;
    updatedAt: string | null;
  };

  type PaginatedRecords<TRecord> = {
    records: TRecord[];
    total: number;
  };

  type QsarQueueDiagnostics = {
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

  type SimulationDetails = {
    isActive: boolean;
    isStored: boolean;
    queuePosition: number;
    jobId: string;
    stepData: string[];
    logData: string[];
    simulation: Simulation;
    molecules: {
      macromolecule: string;
      ligands: string[];
    };
  };
}
