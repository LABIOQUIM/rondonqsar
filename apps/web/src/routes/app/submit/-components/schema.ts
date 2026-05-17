import { z } from "zod";

export const simulationSchema = z.object({
  type: z.enum(["plasmo", "leish"] as const),
  file: z
    .instanceof(File, { message: "SDF file is required" })
    .refine((file) => file.name.toLowerCase().endsWith(".sdf"), {
      message: "File must be an SDF file",
    }),
  forceField: z.string().min(1, "Force field is required"),
  waterModel: z.string().min(1, "Water model is required"),
  boxType: z.string().min(1, "Box type is required"),
  boxDistance: z
    .number({ error: "Box distance is required" })
    .min(0.1, "Minimum is 0.1 nm")
    .max(1.2, "Maximum is 1.2 nm"),
});

export type SimulationFormValues = z.infer<typeof simulationSchema>;
