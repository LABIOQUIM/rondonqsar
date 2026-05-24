import { Box, Group } from "@mantine/core"; // Group for layout, Box for semantic header
import { IconPlayerPlay } from "@tabler/icons-react";
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
          {/* Mantine Group for spacing items is fine */}
          <nav className={styles.navLinks}>
            <Link className={styles.navLink} to="/">
              About
            </Link>
            <Link className={styles.navLink} to="/guides">
              Guides
            </Link>
          </nav>
          <Link className={styles.launchButton} to="/auth/login">
            <IconPlayerPlay size={22} />
            Launch App
          </Link>
        </Group>
      </div>
    </Box>
  );
}
