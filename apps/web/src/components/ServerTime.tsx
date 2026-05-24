import { Box, Text, Title } from "@mantine/core";
import { useEffect, useState } from "react";

import { dateFormatWithSecs } from "@/lib/utils";

import classes from "./ServerTime.module.css";

export function ServerTime() {
  const [serverTime, updateServerTime] = useState<Date | null>(null);

  useEffect(() => {
    updateServerTime(new Date());

    const interval = window.setInterval(() => updateServerTime(new Date()), 1000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <Box className={classes.container}>
      <Title className={classes.label} order={4}>
        Server Time:
      </Title>
      <Text>{serverTime ? dateFormatWithSecs(serverTime) : "--"}</Text>
    </Box>
  );
}
