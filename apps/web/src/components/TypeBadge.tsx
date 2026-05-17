import classes from "./TypeBadge.module.css";

const labels: Record<SIMULATION_TYPE, string> = {
  plasmo: "Plasmo",
  leish: "Leish",
};

type TypeBadgeProps = {
  type: SIMULATION_TYPE;
};

export function TypeBadge({ type }: TypeBadgeProps) {
  return <span className={`${classes.badge} ${classes[type]}`}>{labels[type]}</span>;
}
