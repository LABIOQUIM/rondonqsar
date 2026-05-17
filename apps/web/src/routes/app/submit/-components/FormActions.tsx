import { Button } from "@mantine/core";
import { useFlag } from "@openfeature/react-sdk";
import { IconPlayerPlay } from "@tabler/icons-react";

interface Props {
  submitClassName: string;
  containerClassName: string;
}

export function FormActions({ submitClassName, containerClassName }: Props) {
  const { value: submissionEnabled } = useFlag("simulation-submission", false);

  return (
    <div className={containerClassName}>
      <Button
        className={submitClassName}
        disabled={!submissionEnabled}
        leftSection={<IconPlayerPlay size={16} />}
        type="submit"
      >
        Run Simulation
      </Button>
    </div>
  );
}
