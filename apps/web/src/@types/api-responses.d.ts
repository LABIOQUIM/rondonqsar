export {};

declare global {
  type PlasmoTaskSummary = {
    id: string;
    originalName: string;
    status: PLASMO_TASK_STATUS;
    jobId: string | null;
    errorMessage: string | null;
    createdAt: string;
    updatedAt: string | null;
    resultCount: number;
  };

  type UserPlasmoTasks = {
    records: PlasmoTaskSummary[];
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

  type PlasmoTaskDetails = PlasmoTaskSummary & {
    results: PlasmoResultRow[];
  };

  type PlasmoSubmitResponse = {
    calculation: "plasmo";
    taskId: string;
    jobId: string;
    status: "queued";
    file: {
      filename: string;
      path: string;
      originalName: string;
    };
  };

  type LeishTaskSummary = {
    id: string;
    originalName: string;
    status: LEISH_TASK_STATUS;
    jobId: string | null;
    errorMessage: string | null;
    createdAt: string;
    updatedAt: string | null;
    resultCount: number;
  };

  type UserLeishTasks = {
    records: LeishTaskSummary[];
    total: number;
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

  type LeishTaskDetails = LeishTaskSummary & {
    results: LeishResultRow[];
  };

  type LeishSubmitResponse = {
    calculation: "leish";
    taskId: string;
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
