import { ActionIcon, Avatar, Box, Group, Text } from "@mantine/core";
import { IconLogout } from "@tabler/icons-react";
import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";

import { authClient } from "@/lib/auth-client";

import classes from "./User.module.css";

export function User() {
  const { data } = authClient.useSession();
  const navigate = useNavigate();

  const onLogout = useCallback(async () => {
    await authClient.signOut();
    await navigate({ to: "/auth/login" });
  }, [navigate]);

  if (!data?.session || !data.user) {
    return null;
  }

  return (
    <Box className={classes.user}>
      <Group>
        <Avatar radius="xl" />

        <Box style={{ flex: 1 }}>
          <Text fw={500} lineClamp={1} size="sm">
            {data.user.name}
          </Text>

          <Text c="dimmed" lineClamp={1} size="xs">
            {data.user.email}
          </Text>
        </Box>

        <ActionIcon color="red" onClick={onLogout} size="lg" variant="light">
          <IconLogout size={18} />
        </ActionIcon>
      </Group>
    </Box>
  );
}
