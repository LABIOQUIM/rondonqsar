import { ActionIcon, Avatar, Box, Group, Text } from "@mantine/core";
import { IconLogout } from "@tabler/icons-react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback } from "react";

import { type ServerAuthSession, signOut } from "@/lib/api";

import classes from "./User.module.css";

type Props = {
  session: ServerAuthSession;
};

export function User({ session }: Props) {
  const navigate = useNavigate();
  const signOutFn = useServerFn(signOut);

  const onLogout = useCallback(async () => {
    await signOutFn();
    await navigate({ to: "/auth/login" });
  }, [navigate, signOutFn]);

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
