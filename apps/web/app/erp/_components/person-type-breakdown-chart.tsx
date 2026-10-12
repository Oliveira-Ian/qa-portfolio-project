'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { useT } from '@/lib/i18n/provider';

interface PersonTypeBreakdownChartProps {
  clients: number;
  suppliers: number;
  inactive: number;
}

/**
 * Reuses existing design tokens rather than inventing chart-specific colors
 * — this app doesn't define `--chart-1..5` (the shadcn default), and three
 * semantically distinct tokens already exist. The series' *names* are the
 * interface language's, so the config is built where `useT()` is.
 */
const SERIES_COLOR = {
  clients: 'var(--primary)',
  suppliers: 'var(--toast-info)',
  inactive: 'var(--muted-foreground)',
} as const;

/**
 * A person's `types` is an array — a record can be both a client and a
 * supplier at once — so these three bars are independent counts, not slices
 * of one whole. A pie chart would visually claim otherwise; a bar chart
 * doesn't.
 */
export function PersonTypeBreakdownChart({
  clients,
  suppliers,
  inactive,
}: PersonTypeBreakdownChartProps) {
  const t = useT();
  const chartConfig = {
    clients: { label: t('erp.home.stats.clients'), color: SERIES_COLOR.clients },
    suppliers: { label: t('erp.home.stats.suppliers'), color: SERIES_COLOR.suppliers },
    inactive: { label: t('erp.home.stats.inactive'), color: SERIES_COLOR.inactive },
  } satisfies ChartConfig;
  const data = [
    { category: t('erp.home.stats.clients'), value: clients, fill: 'var(--color-clients)' },
    { category: t('erp.home.stats.suppliers'), value: suppliers, fill: 'var(--color-suppliers)' },
    { category: t('erp.home.stats.inactive'), value: inactive, fill: 'var(--color-inactive)' },
  ];

  return (
    <ChartContainer config={chartConfig} className="h-48 w-full">
      <BarChart data={data} layout="vertical" margin={{ left: 8 }}>
        <CartesianGrid horizontal={false} />
        <XAxis type="number" hide allowDecimals={false} />
        <YAxis dataKey="category" type="category" tickLine={false} axisLine={false} width={80} />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideIndicator formatter={(value) => value} />}
        />
        <Bar dataKey="value" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
