import { generateColors } from "@mantine/colors-generator";
import { createTheme } from "@mantine/core";

import components from "./overrides";

export const theme = createTheme({
  components,
  cursorType: "pointer",
  fontFamily: "Inter, sans-serif",
  colors: {
    rondonteal: generateColors("#15aabf"),
  },
  primaryColor: "rondonteal",
  breakpoints: {
    xs: "30em",
    sm: "40em",
    md: "48em",
    lg: "64em",
    xl: "80em",
    "2xl": "96em",
    "3xl": "120em",
    "4xl": "160em",
  },
});
