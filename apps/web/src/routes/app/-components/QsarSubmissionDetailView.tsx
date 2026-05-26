import type React from "react";

import {
  Alert,
  Badge,
  Box,
  Code,
  Group,
  Stack,
  Switch,
  Tabs,
  Text,
  Title,
  Tooltip,
} from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import dayjs from "dayjs";
import {
  MantineReactTable,
  MRT_TablePagination,
  type MRT_CellValue,
  type MRT_Column,
  type MRT_ColumnDef,
  type MRT_RowData,
  type MRT_TableInstance,
  useMantineReactTable,
} from "mantine-react-table-open";
import { useState } from "react";

import { Heading } from "@/components/Heading";
import { Loader } from "@/components/Loader";
import { PageLayout } from "@/components/PageLayout";
import { StatusBadge } from "@/components/StatusBadge";

import classes from "../$submissionId.module.css";
import {
  LEISH_QSAR_FORMULA,
  PLASMO_QSAR_FORMULA,
  type QsarFormulaDefinition,
} from "../-formula-data";

type QsarSubmissionRecord = QsarSubmissionDetails | AdminQsarSubmissionDetails;

type Props = {
  data: QsarSubmissionRecord | undefined;
  error: unknown;
  extraSummaryItems?: Array<{
    label: string;
    truncate?: boolean | undefined;
    value: React.ReactNode;
  }>;
  isError: boolean;
  isLoading: boolean;
  heading: string;
};

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  const date = dayjs(value);

  if (!date.isValid()) {
    return "—";
  }

  return date.format("YYYY-MM-DD HH:mm:ss");
}

const MOLECULE_COLUMN_SIZE = 88;
const RESULT_COLUMN_MIN_SIZE = 116;
const DESCRIPTOR_MAX_DISPLAY_VALUE = 99999.9999;
const NUMERIC_COLUMN_IDS = new Set([
  "moleculeNumber",
  "descriptorA",
  "descriptorB",
  "descriptorC",
  "descriptorD",
  "pec50",
  "ec50",
]);

function formatFixedDecimal(value: number, precision: number) {
  return Number.isFinite(value) ? value.toFixed(precision) : String(value);
}

function formatDescriptorValue(value: number) {
  return formatFixedDecimal(Math.min(value, DESCRIPTOR_MAX_DISPLAY_VALUE), 4);
}

function formatPec50Value(value: number) {
  return formatFixedDecimal(value, 4);
}

function formatEc50Value(value: number) {
  return formatFixedDecimal(value, 4);
}

function getNumberCellClass(column: MRT_Column<any, MRT_CellValue>) {
  return NUMERIC_COLUMN_IDS.has(column.id) ? classes.numberCell : "";
}

function getNumberHeadCellClass(column: MRT_Column<any, MRT_CellValue>) {
  return NUMERIC_COLUMN_IDS.has(column.id)
    ? `${classes.tableHeadCell} ${classes.numberHeadCell}`
    : classes.tableHeadCell;
}

function moleculeColumn<TData extends { moleculeNumber: number }>(): MRT_ColumnDef<TData> {
  return {
    accessorKey: "moleculeNumber",
    header: "Nº",
    grow: false,
    maxSize: MOLECULE_COLUMN_SIZE,
    minSize: MOLECULE_COLUMN_SIZE,
    size: MOLECULE_COLUMN_SIZE,
    Cell: ({ cell }) => cell.getValue<number>(),
  };
}

function resultNumberColumn<TData extends Record<string, unknown>>(
  accessorKey: keyof TData & string,
  header: string,
  formatValue: (value: number) => string,
): MRT_ColumnDef<TData> {
  return {
    accessorKey,
    header,
    grow: 1,
    minSize: RESULT_COLUMN_MIN_SIZE,
    Cell: ({ cell }) => formatValue(cell.getValue<number>()),
  };
}

function ResultBottomToolbar<TData extends MRT_RowData>({
  table,
}: {
  table: MRT_TableInstance<TData>;
}) {
  const {
    pagination: { pageIndex = 0, pageSize = 10 },
  } = table.getState();
  const total = table.options.rowCount ?? table.getPrePaginationRowModel().rows.length;
  const start = total === 0 ? 0 : pageIndex * pageSize + 1;
  const end = Math.min((pageIndex + 1) * pageSize, total);

  return (
    <Box className={classes.bottomToolbar}>
      <Text className={classes.paginationRange} size="sm">
        {start.toLocaleString()} - {end.toLocaleString()} of {total.toLocaleString()}
      </Text>
      <MRT_TablePagination position="bottom" table={table} />
    </Box>
  );
}

function SummaryItem({
  label,
  truncate,
  value,
}: {
  label: string;
  truncate?: boolean | undefined;
  value: React.ReactNode;
}) {
  return (
    <Box className={classes.summaryItem}>
      <Text className={classes.summaryLabel}>{label}</Text>
      <Text
        className={`${classes.summaryValue} ${truncate ? classes.summaryValueTruncated : ""}`}
        component="div"
      >
        {value ?? "—"}
      </Text>
    </Box>
  );
}

function formatCoefficient(value: number) {
  return String(value);
}

function formatPowerTerm(descriptor: string, power: number) {
  return power === 1 ? descriptor : `${descriptor}^${power}`;
}

function formatFormulaTerm(formula: QsarFormulaDefinition, powers: readonly number[]) {
  const factors = formula.descriptors
    .map((descriptor, index) => {
      const power = powers[index] ?? 0;

      return power > 0 ? formatPowerTerm(descriptor, power) : null;
    })
    .filter((factor): factor is string => factor !== null);

  return factors.length > 0 ? factors.join(" × ") : "Intercept";
}

function formatFullFormulaTerm(
  formula: QsarFormulaDefinition,
  term: QsarFormulaDefinition["terms"][number],
) {
  const factors = formula.descriptors
    .map((descriptor, index) => {
      const power = term.powers[index] ?? 0;

      return power > 0 ? formatPowerTerm(descriptor, power) : null;
    })
    .filter((factor): factor is string => factor !== null);
  const coefficient = Math.abs(term.coefficient);

  return factors.length > 0
    ? `${formatCoefficient(coefficient)} × ${factors.join(" × ")}`
    : formatCoefficient(coefficient);
}

function getFormulaDegree(term: QsarFormulaDefinition["terms"][number]) {
  return term.powers.reduce((total, power) => total + power, 0);
}

function getFormulaDegreeLabel(degree: number) {
  switch (degree) {
    case 0:
      return "Intercept";
    case 1:
      return "Linear terms";
    case 2:
      return "Quadratic terms";
    case 3:
      return "Cubic terms";
    case 4:
      return "Quartic terms";
    default:
      return `Degree ${degree} terms`;
  }
}

function getFormulaPreviewGroups(formula: QsarFormulaDefinition) {
  const groups: Array<{
    degree: number;
    label: string;
    terms: QsarFormulaDefinition["terms"];
  }> = [];

  for (const term of formula.terms) {
    const degree = getFormulaDegree(term);
    const currentGroup = groups.at(-1);

    if (currentGroup && currentGroup.degree === degree) {
      currentGroup.terms = [...currentGroup.terms, term];
    } else {
      groups.push({
        degree,
        label: getFormulaDegreeLabel(degree),
        terms: [term],
      });
    }
  }

  return groups;
}

function FormulaPanel({ formula }: { formula: QsarFormulaDefinition }) {
  const [showFullFormulaPreview, setShowFullFormulaPreview] = useState(true);
  const formulaPreviewGroups = getFormulaPreviewGroups(formula);

  return (
    <Stack className={classes.formulaPanel} gap="md">
      <Box>
        <Title order={4}>{formula.title}</Title>
        <Text c="dimmed" size="sm">
          Reference formula used to calculate the result rows for this QSAR model.
        </Text>
      </Box>

      <div className={classes.formulaSummary}>
        <Box className={classes.formulaSummaryItem}>
          <Text className={classes.summaryLabel}>Descriptors</Text>
          <Text className={classes.formulaValue}>{formula.descriptors.join(", ")}</Text>
        </Box>
        <Box className={classes.formulaSummaryItem}>
          <Text className={classes.summaryLabel}>pEC50</Text>
          <Code block>pEC50 = Σ ci × Π(Dj ^ pij)</Code>
        </Box>
        <Box className={classes.formulaSummaryItem}>
          <Text className={classes.summaryLabel}>EC50</Text>
          <Code block>{formula.ec50Formula}</Code>
        </Box>
      </div>

      <Group className={classes.formulaToggleRow} justify="flex-end">
        <Switch
          checked={showFullFormulaPreview}
          label="Show full formula preview"
          onChange={(event) => setShowFullFormulaPreview(event.currentTarget.checked)}
        />
      </Group>

      {showFullFormulaPreview ? (
        <Box className={classes.formulaPreviewWrapper}>
          <Text className={classes.formulaPreviewHeading}>pEC50 =</Text>
          <Stack gap="sm">
            {formulaPreviewGroups.map((group) => (
              <Box className={classes.formulaPreviewGroup} key={group.degree}>
                <Text className={classes.formulaPreviewGroupTitle}>{group.label}</Text>
                <div className={classes.formulaPreviewTerms}>
                  {group.terms.map((term, index) => {
                    const operator = term.coefficient < 0 ? "-" : "+";
                    const showOperator = index > 0 || operator === "-";

                    return (
                      <Code
                        className={classes.formulaPreviewTerm}
                        key={`${group.degree}-${term.coefficient}-${index}`}
                      >
                        {showOperator ? `${operator} ` : ""}
                        {formatFullFormulaTerm(formula, term)}
                      </Code>
                    );
                  })}
                </div>
              </Box>
            ))}
          </Stack>
        </Box>
      ) : (
        <Box className={classes.formulaTableWrapper}>
          <table className={classes.formulaTable}>
            <thead>
              <tr>
                <th>Coefficient</th>
                {formula.descriptors.map((descriptor) => (
                  <th key={descriptor}>{descriptor}</th>
                ))}
                <th>Term</th>
              </tr>
            </thead>
            <tbody>
              {formula.terms.map((term, index) => (
                <tr key={`${term.coefficient}-${index}`}>
                  <td className={classes.numberCell}>{formatCoefficient(term.coefficient)}</td>
                  {formula.descriptors.map((descriptor, descriptorIndex) => (
                    <td className={classes.numberCell} key={descriptor}>
                      {term.powers[descriptorIndex] ?? 0}
                    </td>
                  ))}
                  <td>{formatFormulaTerm(formula, term.powers)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Box>
      )}
    </Stack>
  );
}

export function QsarSubmissionDetailView({
  data,
  error,
  extraSummaryItems = [],
  isError,
  isLoading,
  heading,
}: Props) {
  const plasmoTable = useMantineReactTable({
    data: data?.plasmoResults || [],
    enablePagination: true,
    enableTopToolbar: false,
    enableStickyHeader: true,
    enableColumnActions: false,
    enableSorting: false,
    layoutMode: "grid",
    mantinePaginationProps: {
      showRowsPerPage: false,
    },
    paginationDisplayMode: "pages",
    mantinePaperProps: {
      className: classes.paper,
    },
    mantineTableContainerProps: {
      className: classes.tableContainer,
    },
    mantineTableProps: {
      highlightOnHover: true,
    },
    mantineTableHeadProps: {
      className: classes.tableHead,
    },
    mantineTableBodyCellProps: ({ column }) => ({
      className: getNumberCellClass(column),
    }),
    mantineTableHeadCellProps: ({ column }) => ({
      className: getNumberHeadCellClass(column),
    }),
    columns: [
      moleculeColumn<PlasmoResultRow>(),
      resultNumberColumn<PlasmoResultRow>("descriptorA", "D143", formatDescriptorValue),
      resultNumberColumn<PlasmoResultRow>("descriptorB", "D312", formatDescriptorValue),
      resultNumberColumn<PlasmoResultRow>("descriptorC", "D470", formatDescriptorValue),
      resultNumberColumn<PlasmoResultRow>("pec50", "pEC50", formatPec50Value),
      resultNumberColumn<PlasmoResultRow>("ec50", "EC50 (µM)", formatEc50Value),
    ],
    renderBottomToolbar: ({ table }) => <ResultBottomToolbar table={table} />,
  });

  const leishTable = useMantineReactTable({
    data: data?.leishResults || [],
    enablePagination: true,
    enableTopToolbar: false,
    enableStickyHeader: true,
    enableColumnActions: false,
    enableSorting: false,
    layoutMode: "grid",
    mantinePaginationProps: {
      showRowsPerPage: false,
    },
    paginationDisplayMode: "pages",
    mantinePaperProps: {
      className: classes.paper,
    },
    mantineTableContainerProps: {
      className: classes.tableContainer,
    },
    mantineTableProps: {
      highlightOnHover: true,
    },
    mantineTableHeadProps: {
      className: classes.tableHead,
    },
    mantineTableBodyCellProps: ({ column }) => ({
      className: getNumberCellClass(column),
    }),
    mantineTableHeadCellProps: ({ column }) => ({
      className: getNumberHeadCellClass(column),
    }),
    columns: [
      moleculeColumn<LeishResultRow>(),
      resultNumberColumn<LeishResultRow>("descriptorA", "D237", formatDescriptorValue),
      resultNumberColumn<LeishResultRow>("descriptorB", "D215", formatDescriptorValue),
      resultNumberColumn<LeishResultRow>("descriptorC", "D466", formatDescriptorValue),
      resultNumberColumn<LeishResultRow>("descriptorD", "D590", formatDescriptorValue),
      resultNumberColumn<LeishResultRow>("pec50", "pEC50", formatPec50Value),
      resultNumberColumn<LeishResultRow>("ec50", "EC50 (µM)", formatEc50Value),
    ],
    renderBottomToolbar: ({ table }) => <ResultBottomToolbar table={table} />,
  });

  if (isLoading) {
    return (
      <PageLayout className={classes.content}>
        <Heading title={heading} />
        <Loader />
      </PageLayout>
    );
  }

  if (isError || !data) {
    return (
      <PageLayout className={classes.content}>
        <Heading title={heading} />
        <Alert color="red" icon={<IconAlertCircle size={18} />} title="Unable to load submission">
          {error instanceof Error ? error.message : "The submission details could not be loaded."}
        </Alert>
      </PageLayout>
    );
  }

  const isCompleted = data.status === "COMPLETED";

  return (
    <PageLayout className={classes.content}>
      <Heading title={heading} />

      <section className={classes.summary}>
        <SummaryItem label="Status" value={<StatusBadge status={data.status} />} />
        <SummaryItem
          label="Input File"
          truncate
          value={
            <Tooltip label={data.originalName} openDelay={400} withArrow>
              <span>{data.originalName}</span>
            </Tooltip>
          }
        />
        <SummaryItem label="Job" value={data.jobId} />
        <SummaryItem label="Submitted" value={formatDate(data.createdAt)} />
        <SummaryItem label="Updated" value={formatDate(data.updatedAt)} />
        {extraSummaryItems.map((item) => (
          <SummaryItem
            key={item.label}
            label={item.label}
            truncate={item.truncate}
            value={item.value}
          />
        ))}
        {data.errorMessage ? <SummaryItem label="Error" value={data.errorMessage} /> : null}
      </section>

      {isCompleted ? (
        <Tabs className={classes.tabs} defaultValue="plasmo" keepMounted={false}>
          <Tabs.List className={classes.tabsList}>
            <Tabs.Tab value="plasmo">
              <Group gap="xs" wrap="nowrap">
                <span>PlasmoQSAR</span>
                <Badge size="sm" variant="light">
                  {data.plasmoResultCount}
                </Badge>
              </Group>
            </Tabs.Tab>
            <Tabs.Tab value="leish">
              <Group gap="xs" wrap="nowrap">
                <span>LeishQSAR</span>
                <Badge size="sm" variant="light">
                  {data.leishResultCount}
                </Badge>
              </Group>
            </Tabs.Tab>
            <Tabs.Tab value="plasmo-formula">PlasmoQSAR Formula</Tabs.Tab>
            <Tabs.Tab value="leish-formula">LeishQSAR Formula</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel className={classes.tabPanel} pt="sm" value="plasmo">
            <MantineReactTable table={plasmoTable} />
          </Tabs.Panel>
          <Tabs.Panel className={classes.tabPanel} pt="sm" value="leish">
            <MantineReactTable table={leishTable} />
          </Tabs.Panel>
          <Tabs.Panel className={classes.tabPanel} pt="sm" value="plasmo-formula">
            <FormulaPanel formula={PLASMO_QSAR_FORMULA} />
          </Tabs.Panel>
          <Tabs.Panel className={classes.tabPanel} pt="sm" value="leish-formula">
            <FormulaPanel formula={LEISH_QSAR_FORMULA} />
          </Tabs.Panel>
        </Tabs>
      ) : (
        <Stack className={classes.statusPanel} gap="xs">
          <Group gap="xs">
            <Title order={4}>Current status</Title>
            <StatusBadge status={data.status} />
          </Group>
          <Text c="dimmed" size="sm">
            Last updated {formatDate(data.updatedAt)}.
          </Text>
          {data.errorMessage ? (
            <Text c="red" size="sm">
              {data.errorMessage}
            </Text>
          ) : null}
        </Stack>
      )}
    </PageLayout>
  );
}
