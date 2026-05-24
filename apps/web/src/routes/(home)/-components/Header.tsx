import { Box, Group } from "@mantine/core"; // Group for layout, Box for semantic header
import { IconLogin2 } from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";

import BRAND_LOGO from "@/assets/rondonqsar.svg";

import styles from "./Header.module.css";

export function LanderHeader() {
  return (
    <Box className={styles.header} component="header">
      <div className={styles.innerHeader}>
        <Link to="/">
          <img alt="RondonQSAR Logo" className={styles.logoImage} src={BRAND_LOGO} />
        </Link>
        <Group>
          <nav className={styles.navLinks}>
            <a className={styles.navLink} href="/#research">
              Research
            </a>
            <a className={styles.navLink} href="/#features">
              Workflow
            </a>
            <a className={styles.navLink} href="/#institutions">
              Institutions
            </a>
          </nav>
          <Link className={styles.launchButton} to="/auth/login">
            <IconLogin2 size={20} />
            Sign In
          </Link>
        </Group>
      </div>
    </Box>
  );
}
