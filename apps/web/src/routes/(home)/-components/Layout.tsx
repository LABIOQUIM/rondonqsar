import { Box } from "@mantine/core";
import React from "react";

import { LanderFooter } from "./Footer";
import { LanderHeader } from "./Header";
import styles from "./Layout.module.css";

interface LayoutProps {
  children: React.ReactNode;
}

export function LanderLayout({ children }: LayoutProps) {
  return (
    <Box className={styles.layout}>
      <LanderHeader />
      <Box className={styles.mainContent} component="main">
        {children}
      </Box>
      <LanderFooter />
    </Box>
  );
}
