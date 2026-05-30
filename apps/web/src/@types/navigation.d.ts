import type { Icon } from "@tabler/icons-react";
import type { LinkProps } from "@tanstack/react-router";

import { MantineColor } from "@mantine/core";

declare global {
  interface NavChildLink {
    icon: Icon;
    label: string;
    href: LinkProps["to"] | "https://visualdynamics.fiocruz.br/";
    external?: boolean;
    disabled?: boolean;
    role?: USER_ROLE;
    badge?: {
      color: MantineColor;
      message: string;
    };
  }

  interface NavLink extends NavChildLink {
    children?: NavChildLink[];
  }

  interface NavSection {
    title: string;
    links: NavLink[];
    disabled?: boolean;
  }
}
