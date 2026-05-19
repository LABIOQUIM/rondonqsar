import { zodResolver } from "@hookform/resolvers/zod";
import { Button, FileInput, Stack, Title } from "@mantine/core";
import { IconUpload } from "@tabler/icons-react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Heading } from "@/components/Heading";
import { PageLayout } from "@/components/PageLayout";
import { submitPlasmoTask } from "@/mutations/submitPlasmoTask";

import classes from "./index.module.css";

const plasmoSubmissionSchema = z.object({
  file: z
    .instanceof(File, { message: "SDF file is required" })
    .refine((file) => file.name.toLowerCase().endsWith(".sdf"), {
      message: "File must be an SDF file",
    }),
});

type PlasmoSubmissionFormValues = z.infer<typeof plasmoSubmissionSchema>;

export const Route = createFileRoute("/app/plasmo/submit/")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const {
    control,
    formState: { isSubmitting },
    handleSubmit,
  } = useForm<PlasmoSubmissionFormValues>({
    resolver: zodResolver(plasmoSubmissionSchema),
  });

  return (
    <PageLayout>
      <Heading title="New PlasmoQSAR Submission" />
      <form className={classes.form} onSubmit={handleSubmit((v) => submitPlasmoTask(v, navigate))}>
        <Stack className={classes.section} gap="xs">
          <Title order={5}>Files</Title>
          <Controller
            control={control}
            name="file"
            render={({ field: { value, onChange, ref }, fieldState }) => (
              <FileInput
                accept=".sdf"
                clearable
                description="SDF format"
                error={fieldState.error?.message}
                label="Input molecules"
                onChange={onChange}
                placeholder="Upload SDF file"
                ref={ref}
                value={value}
                withAsterisk
              />
            )}
          />
        </Stack>
        <div className={classes.actions}>
          <Button leftSection={<IconUpload size={16} />} loading={isSubmitting} type="submit">
            Submit PlasmoQSAR Task
          </Button>
        </div>
      </form>
    </PageLayout>
  );
}
