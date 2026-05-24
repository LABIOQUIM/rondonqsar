import { Box, SimpleGrid } from "@mantine/core";
import {
  IconBinaryTree2,
  IconClockHour4,
  IconFileAnalytics,
  IconFileDescription,
  IconScan,
  IconStethoscope,
} from "@tabler/icons-react";

import { FeatureCard } from "./FeatureCard";
import styles from "./FeaturesSection.module.css";

const featuresData = [
  {
    icon: <IconFileDescription size={32} />,
    title: "Submit structures",
    description:
      "Upload SDF files containing the molecules to be evaluated.",
  },
  {
    icon: <IconClockHour4 size={32} />,
    title: "Follow processing",
    description:
      "Track each submission through queued, processing, completed, and failed states.",
  },
  {
    icon: <IconBinaryTree2 size={32} />,
    title: "Run both QSAR models",
    description:
      "Use one submission to generate PlasmoQSAR and LeishQSAR outputs.",
  },
  {
    icon: <IconFileAnalytics size={32} />,
    title: "Review predictions",
    description:
      "Inspect descriptor values, pEC50 and EC50 predictions, and formula views.",
  },
  {
    icon: <IconScan size={32} />,
    title: "Screening studies",
    description:
      "Organize malaria and leishmaniasis QSAR work in the same application.",
  },
  {
    icon: <IconStethoscope size={32} />,
    title: "Research records",
    description:
      "Keep submitted files, job identifiers, statuses, and outputs connected.",
  },
];

export function LanderFeaturesSection() {
  return (
    <Box className={styles.featuresSection} component="section" id="features">
      <div className={styles.featuresContainer}>
        <div className={styles.sectionHeader}>
          <span className={styles.eyebrow}>Workflow</span>
          <h2 className={styles.sectionTitle}>A direct path from SDF file to QSAR results</h2>
          <p className={styles.sectionDescription}>
            RondonQSAR keeps the routine work simple: upload molecules, wait for the calculation,
            and open the resulting model tables when processing is complete.
          </p>
        </div>
        <SimpleGrid
          className={styles.grid}
          cols={{ base: 1, sm: 2, lg: 3 }}
          spacing={{ base: "lg", sm: "xl" }}
        >
          {featuresData.map((feature) => (
            <FeatureCard
              description={feature.description}
              icon={feature.icon}
              key={feature.title}
              title={feature.title}
            />
          ))}
        </SimpleGrid>
      </div>
    </Box>
  );
}
