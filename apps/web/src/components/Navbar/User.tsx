import { ActionIcon, Avatar, Box, Group, Text } from "@mantine/core";
import { IconLogout } from "@tabler/icons-react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback } from "react";

import { clearCachedAppBootstrap, type ServerAuthSession, signOut } from "@/lib/api";

import classes from "./User.module.css";

type Props = {
  session: ServerAuthSession;
};

export function User({ session }: Props) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const signOutFn = useServerFn(signOut);

  const onLogout = useCallback(async () => {
    await signOutFn();
    clearCachedAppBootstrap(queryClient);
    await navigate({ to: "/auth/login" });
  }, [navigate, queryClient, signOutFn]);

  if (!session?.session || !session.user) {
    return null;
  }

  return (
    <Box className={classes.user}>
      <Group>
        <Avatar radius="xl" />

        <Box style={{ flex: 1 }}>
          <Text fw={500} lineClamp={1} size="sm">
            {session.user.name}
          </Text>

          <Text c="dimmed" lineClamp={1} size="xs">
            {session.user.email}
          </Text>
        </Box>

        <ActionIcon color="red" onClick={onLogout} size="lg" variant="light">
          <IconLogout size={18} />
        </ActionIcon>
      </Group>
    </Box>
  );
}
