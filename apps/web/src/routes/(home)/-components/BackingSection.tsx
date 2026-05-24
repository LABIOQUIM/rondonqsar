import { SimpleGrid } from "@mantine/core";

import FIOCRUZRO from "@/assets/fiocruz-ro.png";
import FIOCRUZ from "@/assets/fiocruz.jpg";
import LABIOQUIM from "@/assets/labioquim.png";
import UFCSPA from "@/assets/ufcspa.png";

import styles from "./BackingSection.module.css";

const backers = [
  {
    name: "LABIOQUIM",
    image: LABIOQUIM,
  },
  {
    name: "FIOCRUZ",
    image: FIOCRUZ,
  },
  {
    name: "FIOCRUZ/RO",
    image: FIOCRUZRO,
  },
  {
    name: "UFCSPA",
    image: UFCSPA,
  },
];

export function LanderBackingSection() {
  return (
    <section className={styles.section} id="institutions">
      <div className={styles.intro}>
        <span className={styles.eyebrow}>Institutional support</span>
        <h2>Developed with research collaborators</h2>
        <p>
          RondonQSAR is connected to Fiocruz Rondônia and collaborating groups in medicinal
          chemistry, bioinformatics, and biosystems modeling.
        </p>
      </div>
      <SimpleGrid
        className={styles.backersWrapper}
        cols={{ base: 1, sm: 2, lg: 4 }}
        spacing={{ base: "lg", sm: "xl" }}
      >
        {backers.map((backer) => (
          <div className={styles.backerCard} key={backer.name}>
            <img
              alt={backer.name}
              className={styles.backerImage}
              key={backer.name}
              src={backer.image}
            />
            <span className={styles.backerName}>{backer.name}</span>
          </div>
        ))}
      </SimpleGrid>
    </section>
  );
}
