import classes from "./StatusBadge.module.css";

type BadgeStatus = SIMULATION_STATUS | QSAR_SUBMISSION_STATUS;

const labels: Record<BadgeStatus, string> = {
  CANCELED: "Canceled",
  COMPLETED: "Completed",
  ERRORED: "Errored",
  FAILED: "Failed",
  GENERATED: "Generated",
  PROCESSING: "Processing",
  QUEUED: "Queued",
  RUNNING: "Running",
};

type StatusBadgeProps = {
  status: BadgeStatus;
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return <span className={`${classes.badge} ${classes[status]}`}>{labels[status]}</span>;
}
