import { zodResolver } from "@hookform/resolvers/zod";
import { Blockquote, Stack } from "@mantine/core";
import { IconInfoCircle } from "@tabler/icons-react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";

import { Heading } from "@/components/Heading";
import { PageLayout } from "@/components/PageLayout";
import { submitSimulation } from "@/mutations/submitSimulation";

import { FilesSection } from "./-components/FilesSection";
import { FormActions } from "./-components/FormActions";
import { ParametersSection } from "./-components/ParametersSection";
import { type SimulationFormValues, simulationSchema } from "./-components/schema";
import { SectionContainer } from "./-components/SectionContainer";
import { SimulationMolViewer } from "./-components/SimulationMolViewer";
import { SimulationTypeSelector } from "./-components/SimulationTypeSelector";
import classes from "./index.module.css";

export const Route = createFileRoute("/app/submit/")({
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = useNavigate();
  const { control, handleSubmit, resetField } = useForm<SimulationFormValues>({
    resolver: zodResolver(simulationSchema),
    defaultValues: {
      type: "plasmo",
      forceField: "",
      waterModel: "",
      boxType: "",
      boxDistance: 0.1,
    },
  });

  return (
    <PageLayout className={classes.pageLayout}>
      <Heading title="Submit Simulation" />
      <form className={classes.form} onSubmit={handleSubmit((v) => submitSimulation(v, navigate))}>
        <div className={classes.layout}>
          <div className={classes.formColumn}>
            <Stack className={classes.formScrollArea} gap="lg">
              <SectionContainer title="Simulation Type">
                <SimulationTypeSelector
                  control={control}
                  onTypeChange={() => resetField("forceField")}
                />
              </SectionContainer>
              <SectionContainer title="Files">
                <FilesSection control={control} />
              </SectionContainer>
              <ParametersSection control={control} />
            </Stack>
            <FormActions
              containerClassName={classes.formButtons}
              submitClassName={classes.formSubmitButton}
            />
          </div>

          <div className={classes.viewerColumn}>
            <SimulationMolViewer control={control} />
            <Blockquote color="blue" icon={<IconInfoCircle />}>
              Simulation time is fixed at 5ns. Contact{" "}
              <a href="mailto:fernando.zanchi@fiocruz.br">fernando.zanchi@fiocruz.br</a> if you need
              more time.
            </Blockquote>
          </div>
        </div>
      </form>
    </PageLayout>
  );
}
