import { Box } from "@mantine/core";
import { IconArrowRight, IconFileUpload } from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";

import styles from "./CallToActionSection.module.css";

export function LanderCallToActionSection() {
  return (
    <Box className={styles.ctaSection} component="section">
      <div className={styles.ctaContainer}>
        <span className={styles.eyebrow}>Next step</span>
        <h2 className={styles.title}>Start a QSAR submission.</h2>
        <p className={styles.description}>
          Sign in, upload an SDF file, and follow the calculation through to PlasmoQSAR and
          LeishQSAR results.
        </p>
        <div className={styles.actions}>
          <Link className={styles.button} to="/app/submit">
            <IconFileUpload size={20} />
            Start a QSAR submission
          </Link>
          <Link className={styles.secondaryLink} to="/auth/login">
            Sign in
            <IconArrowRight size={18} />
          </Link>
        </div>
      </div>
    </Box>
  );
}
