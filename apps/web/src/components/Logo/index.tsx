import { Box } from "@mantine/core";
import { Link } from "@tanstack/react-router";

import BrandLogoImage from "@/assets/rondonqsar.svg";

import classes from "./Logo.module.css";

interface Props {
  size?: "normal" | "large";
}

export function Logo({ size = "normal" }: Props) {
  const height = {
    normal: 48,
    large: 96,
  };
  return (
    <Box className={classes.container} component={Link} to="/">
      <img alt="RondonQSAR Logo" src={BrandLogoImage} style={{ height: height[size], width: "auto" }} />
    </Box>
  );
}
