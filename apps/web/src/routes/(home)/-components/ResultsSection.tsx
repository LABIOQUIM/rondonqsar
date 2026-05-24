import { Badge, Box } from "@mantine/core";
import {
  IconBinaryTree2,
  IconChartHistogram,
  IconDatabaseSearch,
  IconTableExport,
} from "@tabler/icons-react";

import styles from "./ResultsSection.module.css";

const resultCards = [
  {
    icon: <IconDatabaseSearch size={22} />,
    title: "Descriptor values",
    description:
      "Model-specific descriptors are extracted from each submitted molecule.",
  },
  {
    icon: <IconChartHistogram size={22} />,
    title: "Prediction tables",
    description:
      "PlasmoQSAR and LeishQSAR results are shown in dedicated tables.",
  },
  {
    icon: <IconBinaryTree2 size={22} />,
    title: "Formula views",
    description:
      "Completed submissions include the formula view used to organize model terms.",
  },
  {
    icon: <IconTableExport size={22} />,
    title: "Submission history",
    description:
      "Status, file name, job ID, and timestamps remain available after submission.",
  },
];

export function LanderResultsSection() {
  return (
    <Box className={styles.section} component="section" id="results">
      <div className={styles.container}>
        <div className={styles.heading}>
          <Badge className={styles.eyebrow} radius="sm" variant="light">
            Outputs
          </Badge>
          <h2>Results designed for review and follow-up</h2>
          <p>
            Completed submissions bring the calculation record and prediction output together:
            descriptors, pEC50 and EC50 values, model tabs, formulas, and processing status.
          </p>
        </div>

        <div className={styles.grid}>
          {resultCards.map((item) => (
            <article className={styles.card} key={item.title}>
              <div className={styles.icon}>{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </Box>
  );
}
