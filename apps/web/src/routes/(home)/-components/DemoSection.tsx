import { Box } from "@mantine/core";
import { IconPlayerPlay } from "@tabler/icons-react";

import styles from "./DemoSection.module.css";

export function LanderDemoSection() {
  return (
    <Box className={styles.demoSection} component="section" id="demo">
      <div className={styles.demoContainer}>
        <h2 className={styles.sectionTitle}>Screening workflow overview</h2>
        <p className={styles.description}>
          A short walkthrough can show SDF submission, queue tracking, and result inspection across
          the RondonQSAR workflow.
        </p>
        {/* AspectRatio for maintaining video dimensions is a structural prop */}
        <div className={styles.videoPlaceholder}>
          <IconPlayerPlay className={styles.playIcon} size={80} stroke={1.5} />
        </div>
      </div>
    </Box>
  );
}
