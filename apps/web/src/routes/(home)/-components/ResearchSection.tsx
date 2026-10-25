import { Anchor, Badge, Box, Group } from "@mantine/core";
import {
  IconArrowUpRight,
  IconDownload,
  IconFlask2,
  IconMicroscope,
  IconVirusSearch,
} from "@tabler/icons-react";

import styles from "./ResearchSection.module.css";

const researches = [
  {
    doi: "10.1021/acsomega.4c05768",
    url: "https://pubs.acs.org/doi/10.1021/acsomega.4c05768",
    title:
      "Application of Machine Learning in the Development of Fourth Degree Quantitative Structure-Activity Relationship Model for Triclosan Analogs Tested against Plasmodium falciparum 3D7",
    summary:
      "The study combines machine learning and QSAR to produce a supervised fourth-degree polynomial model. In RondonQSAR, that work is represented through descriptor-based prediction, pEC50 and EC50 estimates, and result tables for submitted molecules.",
    highlights: [
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
    ],
  },
  {
    doi: "under review",
    title:
      "Machine Learning-Based QSAR Modeling and Web Implementation for Predicting Antileishmanial Activity against Leishmania (Viannia) braziliensis",
    summary: "",
    highlights: [],
    download: {
      href: "/Supplementary%20Table%20S2.xlsx",
      label: "Download Supplementary Table S2 (.xlsx)",
      text: "The supplementary data for this study, currently under review, is available for download.",
    },
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

        {researches.map((research) => (
          <div className={styles.paperCard} key={research.doi}>
            <div className={styles.paperMeta}>
              <span>Featured publication</span>
              <span>DOI {research.doi}</span>
            </div>

            <h3 className={styles.paperTitle}>{research.title}</h3>

            {research.summary && <p className={styles.paperSummary}>{research.summary}</p>}

            {research.highlights.length > 0 && (
              <div className={styles.highlights}>
                {research.highlights.map((item) => (
                  <div className={styles.highlightItem} key={item.label}>
                    <div className={styles.highlightLabel}>
                      {item.icon}
                      <span>{item.label}</span>
                    </div>
                    <p>{item.value}</p>
                  </div>
                ))}
              </div>
            )}

            {research.download && <p className={styles.paperSummary}>{research.download.text}</p>}

            <Group className={styles.paperActions} gap="md">
              {research.url && (
                <Anchor
                  className={styles.paperLink}
                  href={research.url}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  Read the publication
                  <IconArrowUpRight size={16} />
                </Anchor>
              )}
              {research.download && (
                <Anchor className={styles.paperLink} download href={research.download.href}>
                  {research.download.label}
                  <IconDownload size={16} />
                </Anchor>
              )}
            </Group>
          </div>
        ))}
      </div>
    </Box>
  );
}
