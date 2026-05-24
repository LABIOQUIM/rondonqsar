import type { MRT_TableInstance } from "mantine-react-table-open";

import { Button, Modal, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import dayjs from "dayjs";
import { useCallback, useMemo, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";

import { type SerializableJson } from "@/lib/api";
import { createUser } from "@/mutations/auth";
import { getMgmtUsers } from "@/queries/getMgmtUsers";

import type { ImporterUser } from "./Provider";

import classes from "./ImportButton.module.css";

type Props = {
  table: MRT_TableInstance<ImporterUser>;
};

function parseDate(val: string) {
  const d = dayjs(val);
  return d.isValid() ? val : undefined;
}

function compactRecord(values: Record<string, SerializableJson | undefined>) {
  return Object.fromEntries(
    Object.entries(values).filter(
      (entry): entry is [string, SerializableJson] => entry[1] !== undefined,
    ),
  );
}

export function ImportButton({ table }: Props) {
  const createUserFn = useServerFn(createUser);
  const [opened, { open, close }] = useDisclosure(false);
  const [isPending, setPending] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState<{
    imported: number;
    errors: string[];
  } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { refetch } = useQuery(getMgmtUsers({}));

  const selectedRows = useMemo(
    () => table.getSelectedRowModel().rows,
    [table.getSelectedRowModel().rows],
  );

  const fillWidth = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;

  const onImport = useCallback(async () => {
    const rows = selectedRows.map((r) => r.original);

    setPending(true);
    setResult(null);
    flushSync(() => setProgress({ done: 0, total: rows.length }));

    let imported = 0;
    const errors: string[] = [];

    for (const user of rows) {
      try {
        await createUserFn({
          data: {
            data: {
              ...compactRecord({
                createdAt: parseDate(user.createdAt),
                updatedAt: parseDate(user.updatedAt),
              }),
              displayUsername: user.username.trim(),
              username: user.username.trim(),
            },
            email: user.email.trim(),
            name: user.name.trim(),
            role: user.role.trim(),
          },
        });
        imported++;
      } catch {
        errors.push(`${user.username}: request failed`);
      }

      flushSync(() => setProgress((p) => ({ ...p, done: p.done + 1 })));
    }

    const res = { imported, errors };
    setResult(res);
    setPending(false);

    notifications.show({
      message: `Imported ${res.imported} user(s)${res.errors.length ? `, ${res.errors.length} error(s)` : ""}`,
      color: res.errors.length ? "orange" : "green",
    });

    table.resetRowSelection();
    refetch();
  }, [createUserFn, selectedRows, table, refetch]);

  return (
    <>
      <Modal
        centered
        closeOnClickOutside={!isPending}
        closeOnEscape={!isPending}
        onClose={close}
        opened={opened}
        title="Import Users"
        withCloseButton={!isPending}
      >
        {result ? (
          <Stack>
            <Text>
              Imported <strong>{result.imported}</strong> user(s).
            </Text>
            {result.errors.length > 0 && (
              <Stack gap="xs">
                <Text c="red" fw={600}>
                  {result.errors.length} error(s):
                </Text>
                {result.errors.map((e, i) => (
                  <Text c="red" fz="sm" key={i}>
                    {e}
                  </Text>
                ))}
              </Stack>
            )}
            <Button fullWidth onClick={close} variant="default">
              Close
            </Button>
          </Stack>
        ) : (
          <Stack>
            <Text>
              Import <strong>{selectedRows.length}</strong> selected user(s) into the system?
            </Text>
            <Button
              classNames={{
                root: classes.progressButton,
                inner: classes.inner,
              }}
              disabled={isPending && progress.total === 0}
              fullWidth
              onClick={onImport}
              ref={buttonRef}
              style={{ "--fill-width": `${fillWidth}%` } as React.CSSProperties}
              variant={isPending ? "outline" : "filled"}
            >
              {!isPending && "Confirm Import"}
              {isPending &&
                buttonRef.current &&
                createPortal(
                  <>
                    <span className={classes.primaryLayer}>
                      Importing {progress.done}/{progress.total}…
                    </span>
                    <span className={classes.whiteLayer}>
                      Importing {progress.done}/{progress.total}…
                    </span>
                  </>,
                  buttonRef.current,
                )}
            </Button>
          </Stack>
        )}
      </Modal>

      <Button disabled={selectedRows.length === 0} onClick={open}>
        Import
      </Button>
    </>
  );
}
