import { Box } from "@mantine/core";
import { useMemo } from "react";

import classes from "./Loader.module.css";

interface Props {
  steps?: number;
}

export function Loader({ steps = 3 }: Props) {
  const stepsArr = useMemo(() => [...Array(steps)], [steps]);

  return (
    <Box className={classes.container}>
      {stepsArr.map((_, idx) => (
        <div
          className={classes.square}
          key={`loader-square-${idx}`}
          style={{ animationDelay: `${0.2 * idx}s` }}
        />
      ))}
    </Box>
  );
}
