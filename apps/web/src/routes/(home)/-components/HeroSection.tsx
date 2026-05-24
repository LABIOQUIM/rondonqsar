import { Box } from "@mantine/core";
import { IconArrowRight, IconFileUpload, IconLogin2 } from "@tabler/icons-react";
import { Link } from "@tanstack/react-router";

import styles from "./HeroSection.module.css";

export function LanderHeroSection() {
  return (
    <Box className={styles.hero}>
      <div className={styles.heroContainer}>
        <span className={styles.eyebrow}>QSAR screening for malaria and leishmaniasis research</span>
        <h1 className={styles.title}>
          <span className={styles.brandWord}>RondonQSAR</span>
        </h1>
        <p className={styles.subtitle}>
          Submit molecular structures, follow QSAR processing, and review PlasmoQSAR and LeishQSAR
          predictions in a browser-based research workspace.
        </p>
        <div className={styles.signalGrid}>
          <div className={styles.signalItem}>
            <span className={styles.signalLabel}>Input</span>
            <strong>SDF molecular structures</strong>
          </div>
          <div className={styles.signalItem}>
            <span className={styles.signalLabel}>Models</span>
            <strong>PlasmoQSAR and LeishQSAR outputs</strong>
          </div>
          <div className={styles.signalItem}>
            <span className={styles.signalLabel}>Reference</span>
            <strong>ACS Omega, DOI 10.1021/acsomega.4c05768</strong>
          </div>
        </div>
        <div className={styles.buttonsGroup}>
          <Link className={styles.ctaButtonPrimary} to="/auth/login">
            <IconLogin2 size={20} />
            Open RondonQSAR
          </Link>
          <Link className={styles.ctaButtonSecondary} to="/app/submit">
            <IconFileUpload size={20} />
            Start a submission
          </Link>
          <a className={styles.ctaButtonTertiary} href="#research">
            Explore the research
            <IconArrowRight size={20} />
          </a>
        </div>
      </div>
    </Box>
  );
}
