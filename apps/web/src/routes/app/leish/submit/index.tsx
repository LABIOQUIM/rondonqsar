import { zodResolver } from "@hookform/resolvers/zod";
import { Button, FileInput, Stack, Title } from "@mantine/core";
import { IconUpload } from "@tabler/icons-react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Heading } from "@/components/Heading";
import { PageLayout } from "@/components/PageLayout";
import { submitLeishTask } from "@/mutations/submitLeishTask";

import classes from "./index.module.css";

const leishSubmissionSchema = z.object({
  file: z
    .instanceof(File, { message: "SDF file is required" })
    .refine((file) => file.name.toLowerCase().endsWith(".sdf"), {
      message: "File must be an SDF file",
    }),
});

type LeishSubmissionFormValues = z.infer<typeof leishSubmissionSchema>;

export const Route = createFileRoute("/app/leish/submit/")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const {
    control,
    formState: { isSubmitting },
    handleSubmit,
  } = useForm<LeishSubmissionFormValues>({
    resolver: zodResolver(leishSubmissionSchema),
  });

  return (
    <PageLayout>
      <Heading title="New LeishQSAR Submission" />
      <form className={classes.form} onSubmit={handleSubmit((v) => submitLeishTask(v, navigate))}>
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
            Submit LeishQSAR Task
          </Button>
        </div>
      </form>
    </PageLayout>
  );
}
