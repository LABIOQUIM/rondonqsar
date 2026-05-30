import type { ReactNode } from "react";

import { Title } from "@mantine/core";

import classes from "./Heading.module.css";

interface HeadingProps {
  title: string;
  rightElement?: ReactNode;
  centered?: boolean;
}

export function Heading({ centered, rightElement, title }: HeadingProps) {
  return (
    <div className={classes.container} data-centered={centered}>
      <Title order={2}>{title}</Title>
      {rightElement ? <div className={classes.rightElementContainer}>{rightElement}</div> : null}
    </div>
  );
}
