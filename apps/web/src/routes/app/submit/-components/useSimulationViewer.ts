import { useEffect, useState } from "react";

import type { LatestMacromolecules } from "@/queries/latestMacromolecules";

export function useSimulationViewer(file: File | undefined): LatestMacromolecules {
  const [files, setFiles] = useState<LatestMacromolecules>({
    macromolecule: "",
  });

  useEffect(() => {
    if (file instanceof File) {
      file.text().then((text) => setFiles((prev) => ({ ...prev, macromolecule: text })));
    } else {
      setFiles((prev) => ({ ...prev, macromolecule: "" }));
    }
  }, [file]);

  return files;
}
