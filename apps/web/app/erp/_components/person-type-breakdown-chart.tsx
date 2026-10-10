'use client';

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';

interface PersonTypeBreakdownChartProps {
  clients: number;
  suppliers: number;
  inactive: number;
}

/**
 * Reuses existing design tokens rather than inventing chart-specific colors
 * — this app doesn't define `--chart-1..5` (the shadcn default), and three
 * semantically distinct tokens already exist and carry their own dark-mode
 * overrides.
 */
const chartConfig = {
  Clients: { label: 'Clients', color: 'var(--primary)' },
  Suppliers: { label: 'Suppliers', color: 'var(--toast-info)' },
  Inactive: { label: 'Inactive', color: 'var(--muted-foreground)' },
} satisfies ChartConfig;

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
  const data = [
    { category: 'Clients', value: clients, fill: 'var(--color-Clients)' },
    { category: 'Suppliers', value: suppliers, fill: 'var(--color-Suppliers)' },
    { category: 'Inactive', value: inactive, fill: 'var(--color-Inactive)' },
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
