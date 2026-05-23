import { zodResolver } from "@hookform/resolvers/zod";
import { Button, FileInput, Stack, Title } from "@mantine/core";
import { IconUpload } from "@tabler/icons-react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { Heading } from "@/components/Heading";
import { PageLayout } from "@/components/PageLayout";
import { buildPageTitle } from "@/lib/seo";
import { submitQsarSubmission } from "@/mutations/submitQsarSubmission";

import classes from "./index.module.css";

const qsarSubmissionSchema = z.object({
  file: z
    .instanceof(File, { message: "SDF file is required" })
    .refine((file) => file.name.toLowerCase().endsWith(".sdf"), {
      message: "File must be an SDF file",
    }),
});

type QsarSubmissionFormValues = z.infer<typeof qsarSubmissionSchema>;

export const Route = createFileRoute("/app/submit/")({
  head: () => ({
    meta: [{ title: buildPageTitle("New QSAR Submission") }],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const {
    control,
    formState: { isSubmitting },
    handleSubmit,
  } = useForm<QsarSubmissionFormValues>({
    resolver: zodResolver(qsarSubmissionSchema),
  });

  return (
    <PageLayout>
      <Heading title="New QSAR Submission" />
      <form
        className={classes.form}
        onSubmit={handleSubmit((values) => submitQsarSubmission(values, navigate))}
      >
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
            Submit QSAR Task
          </Button>
        </div>
      </form>
    </PageLayout>
  );
}
