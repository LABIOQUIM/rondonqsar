import { type Control, useWatch } from "react-hook-form";

import { LazyMolViewer } from "@/components/LazyMolViewer";

import type { SimulationFormValues } from "./schema";

import { useSimulationViewer } from "./useSimulationViewer";

interface Props {
  control: Control<SimulationFormValues>;
}

export function SimulationMolViewer({ control }: Props) {
  const file = useWatch({ control, name: "file" });
  const files = useSimulationViewer(file);

  return <LazyMolViewer macromolecules={files} />;
}
