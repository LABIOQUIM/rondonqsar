import { type PlasmoJobData } from "./plasmo.types.js";

export async function calculatePlasmo(data: PlasmoJobData) {
  return {
    calculation: data.calculation,
    file: data.file,
  };
}
