import { lazy, Suspense } from "react";

import type { LatestMacromolecules } from "@/queries/latestMacromolecules";

import { Loader } from "@/components/Loader";

const MolViewer = lazy(() => import("@/components/MolViewer"));

interface Props {
  macromolecules?: LatestMacromolecules;
}

export function LazyMolViewer({ macromolecules }: Props) {
  return (
    <Suspense fallback={<Loader />}>
      <MolViewer {...(macromolecules !== undefined ? { macromolecules } : {})} />
    </Suspense>
  );
}
