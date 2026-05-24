import { Anchor, Badge, Box, Group } from "@mantine/core";
import { IconArrowUpRight, IconFlask2, IconMicroscope, IconVirusSearch } from "@tabler/icons-react";

import styles from "./ResearchSection.module.css";

const paperHighlights = [
  {
    icon: <IconFlask2 size={18} />,
    label: "Target",
    value: "Triclosan analogs tested against Plasmodium falciparum 3D7",
  },
  {
    icon: <IconMicroscope size={18} />,
    label: "Approach",
    value: "Machine learning applied to fourth-degree QSAR modeling",
  },
  {
    icon: <IconVirusSearch size={18} />,
    label: "Context",
    value: "Antimalarial screening supported by Fiocruz Rondônia research groups",
  },
];

export function LanderResearchSection() {
  return (
    <Box className={styles.section} component="section" id="research">
      <div className={styles.container}>
        <div className={styles.sectionIntro}>
          <Badge className={styles.eyebrow} radius="sm" variant="light">
            Research basis
          </Badge>
          <h2 className={styles.title}>From QSAR research to a reusable screening workflow</h2>
          <p className={styles.description}>
            The first model highlighted in RondonQSAR comes from published work on triclosan
            analogs tested against Plasmodium falciparum 3D7. The application carries that QSAR
            workflow into a form researchers can run, track, and review from the browser.
          </p>
        </div>

        <div className={styles.paperCard}>
          <div className={styles.paperMeta}>
            <span>Featured publication</span>
            <span>DOI 10.1021/acsomega.4c05768</span>
          </div>

          <h3 className={styles.paperTitle}>
            Application of Machine Learning in the Development of Fourth Degree Quantitative
            Structure-Activity Relationship Model for Triclosan Analogs Tested against
            Plasmodium falciparum 3D7
          </h3>

          <p className={styles.paperSummary}>
            The study combines machine learning and QSAR to produce a supervised fourth-degree
            polynomial model. In RondonQSAR, that work is represented through descriptor-based
            prediction, pEC50 and EC50 estimates, and result tables for submitted molecules.
          </p>

          <div className={styles.highlights}>
            {paperHighlights.map((item) => (
              <div className={styles.highlightItem} key={item.label}>
                <div className={styles.highlightLabel}>
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                <p>{item.value}</p>
              </div>
            ))}
          </div>

          <Group className={styles.paperActions} gap="md">
            <Anchor
              className={styles.paperLink}
              href="https://pubs.acs.org/doi/10.1021/acsomega.4c05768"
              rel="noopener noreferrer"
              target="_blank"
            >
              Read the publication
              <IconArrowUpRight size={16} />
            </Anchor>
          </Group>
        </div>
      </div>
    </Box>
  );
}
