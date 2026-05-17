import { type LeishJobData } from "./leish.types.js";

export async function calculateLeish(data: LeishJobData) {
  return {
    calculation: data.calculation,
    file: data.file,
  };
}
