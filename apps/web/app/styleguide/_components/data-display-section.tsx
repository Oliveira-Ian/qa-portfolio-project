'use client';

import { CheckCircle2, FileText, Pencil, Plus } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Calendar } from '@/components/ui/calendar';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { DescriptionList } from '@/components/ui/description-list';
import { StatCard } from '@/components/ui/stat-card';
import { Stepper } from '@/components/ui/stepper';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Timeline } from '@/components/ui/timeline';
import { ComponentDemo, StyleguideSection } from './section-shell';

const CHART_CONFIG = {
  count: { label: 'Records', color: 'var(--primary)' },
} satisfies ChartConfig;

const CHART_DATA = [
  { month: 'Apr', count: 12 },
  { month: 'May', count: 18 },
  { month: 'Jun', count: 15 },
  { month: 'Jul', count: 24 },
];

/**
 * The categorical sequence — reused wherever a chart compares distinct
 * categories rather than tracking one metric over time (the trend example
 * above). Same order `/home`'s `PersonTypeBreakdownChart` uses for its first
 * three; existing semantic tokens, not a chart-only palette.
 */
const CATEGORY_CHART_CONFIG = {
  Products: { label: 'Products', color: 'var(--primary)' },
  Services: { label: 'Services', color: 'var(--toast-info)' },
  Consulting: { label: 'Consulting', color: 'var(--signal)' },
  Other: { label: 'Other', color: 'var(--toast-warning)' },
} satisfies ChartConfig;

const CATEGORY_CHART_DATA = [
  { category: 'Products', value: 42, fill: 'var(--color-Products)' },
  { category: 'Services', value: 28, fill: 'var(--color-Services)' },
  { category: 'Consulting', value: 15, fill: 'var(--color-Consulting)' },
  { category: 'Other', value: 9, fill: 'var(--color-Other)' },
];

const ORDER_STEPS = [
  { id: 'received', label: 'Received' },
  { id: 'preparing', label: 'Preparing' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'delivered', label: 'Delivered' },
];

const TIMELINE_ITEMS = [
  { id: '1', title: 'Record created', timestamp: '28/07/2026, 09:12', icon: Plus },
  {
    id: '2',
    title: 'Document edited',
    description: 'CPF corrected',
    timestamp: '29/07/2026, 14:03',
    icon: Pencil,
  },
  { id: '3', title: 'Marked as active', timestamp: '31/07/2026, 08:47', icon: CheckCircle2 },
];

export function DataDisplaySection() {
  return (
    <StyleguideSection id="data-display" title="Data display">
      <ComponentDemo
        id="data-display-table"
        title="Table"
        description="The primitive DataTable (components/data-table/) is built on — pagination, sorting and column customization live there, not here."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Construtora Vale Verde</TableCell>
              <TableCell>Client</TableCell>
              <TableCell>Active</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Oliveira Insumos</TableCell>
              <TableCell>Supplier</TableCell>
              <TableCell>Active</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </ComponentDemo>

      <ComponentDemo
        id="data-display-chart"
        title="Chart"
        description="A thin wrapper around Recharts — colors come from the app's own design tokens, not a separate chart palette."
      >
        <div className="flex flex-col gap-6">
          <div>
            <p className="mb-1.5 text-xs text-muted-foreground">
              Trend — one metric over time. One color, deliberately: varying it would imply
              categories that don&rsquo;t exist.
            </p>
            <ChartContainer config={CHART_CONFIG} className="h-48 w-full">
              <BarChart data={CHART_DATA}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis hide allowDecimals={false} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={4} />
              </BarChart>
            </ChartContainer>
          </div>

          <div>
            <p className="mb-1.5 text-xs text-muted-foreground">
              Category comparison — each category takes the next token in sequence (primary →
              toast-info → signal → toast-warning), the same order{' '}
              <code className="font-mono">/home</code>&rsquo;s &ldquo;By type&rdquo; breakdown uses.
            </p>
            <ChartContainer config={CATEGORY_CHART_CONFIG} className="h-48 w-full">
              <BarChart data={CATEGORY_CHART_DATA} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid horizontal={false} />
                <XAxis type="number" hide allowDecimals={false} />
                <YAxis
                  dataKey="category"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  width={80}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideIndicator formatter={(value) => value} />}
                />
                <Bar dataKey="value" radius={4} />
              </BarChart>
            </ChartContainer>
          </div>
        </div>
      </ComponentDemo>

      <ComponentDemo id="data-display-calendar" title="Calendar">
        <Calendar mode="single" className="w-fit rounded-lg border border-border" />
      </ComponentDemo>

      <ComponentDemo
        id="data-display-carousel"
        title="Carousel"
        description="For a product's image gallery — arrow-key and swipe navigation come from Embla."
      >
        <Carousel className="w-full max-w-xs">
          <CarouselContent>
            {[1, 2, 3].map((slide) => (
              <CarouselItem key={slide}>
                <div className="flex aspect-video items-center justify-center rounded-md border border-border bg-muted text-muted-foreground">
                  <FileText className="size-8" aria-hidden="true" />
                  <span className="sr-only">Slide {slide}</span>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </ComponentDemo>

      <ComponentDemo
        id="data-display-stepper"
        title="Stepper"
        description="A linear workflow status — an order or service request moving through its states."
      >
        <Stepper steps={ORDER_STEPS} currentStep={1} />
      </ComponentDemo>

      <ComponentDemo
        id="data-display-timeline"
        title="Timeline"
        description="A record's history — an audit trail, an order's events."
      >
        <Timeline items={TIMELINE_ITEMS} />
      </ComponentDemo>

      <ComponentDemo
        id="data-display-stat-card"
        title="Stat card"
        description="One cell of a KPI row — /home's Records/Clients/Suppliers/Inactive summary is four of these."
      >
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border shadow-card sm:grid-cols-4">
          <StatCard label="Records" value={128} />
          <StatCard label="Clients" value={64} />
          <StatCard label="Suppliers" value={41} />
          <StatCard label="Inactive" value={7} />
        </dl>
      </ComponentDemo>

      <ComponentDemo
        id="data-display-description-list"
        title="Description list"
        description="A read-only label/value grid for a screen with no form to disable — see components/ui/description-list.tsx."
      >
        <DescriptionList
          items={[
            { label: 'Name', value: 'Construtora Vale Verde' },
            { label: 'Type', value: 'Client' },
            { label: 'Document', value: '52.998.224/0001-25' },
            { label: 'Status', value: 'Active' },
          ]}
        />
      </ComponentDemo>
    </StyleguideSection>
  );
}
