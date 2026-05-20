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
