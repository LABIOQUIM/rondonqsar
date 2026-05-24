import { ActionIcon, Title } from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";
import { useCanGoBack, useLocation, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { parsePathname } from "@/lib/utils";

import classes from "./Heading.module.css";

interface HeadingProps {
  title: string;
  rightElement?: React.ReactNode;
  centered?: boolean;
}

export function Heading({ centered, rightElement, title }: HeadingProps) {
  const router = useRouter();
  const canGoBack = useCanGoBack();
  const [isHydrated, setIsHydrated] = useState(false);
  const pathname = useLocation({
    select: (location) => parsePathname(location.pathname),
  });

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return (
    <div className={classes.container} data-centered={centered}>
      {isHydrated && canGoBack && pathname !== "/app" && (
        <ActionIcon
          aria-label="Go back"
          onClick={() => router.history.back()}
          size="lg"
          variant="subtle"
        >
          <IconArrowLeft className={classes.icon} />
        </ActionIcon>
      )}
      <Title order={2}>{title}</Title>
      {rightElement ? <div className={classes.rightElementContainer}>{rightElement}</div> : null}
    </div>
  );
}
