import { FileInput, Stack } from "@mantine/core";
import { type Control, Controller } from "react-hook-form";

import type { SimulationFormValues } from "./schema";

interface Props {
  control: Control<SimulationFormValues>;
}

export function FilesSection({ control }: Props) {
  return (
    <Stack gap="xs">
      <Controller
        control={control}
        name="file"
        render={({ field: { value, onChange, ref }, fieldState }) => (
          <FileInput
            accept=".sdf"
            clearable
            description="SDF format"
            error={fieldState.error?.message}
            label="Input molecule"
            onChange={onChange}
            placeholder="Upload SDF file"
            ref={ref}
            value={value}
            withAsterisk
          />
        )}
      />
    </Stack>
  );
}
