'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { TimelineData } from '@/types/chart';
import { CATEGORIES, CATEGORY_CONFIG, type Category } from '@/types/transaction';
import { formatCurrency } from '@/utils/format';

interface SpendingTimelineProps {
  data: TimelineData[];
}

interface FlatEntry {
  period: string;
  total: number;
  [key: string]: string | number;
}

interface TooltipPayloadEntry {
  name: string;
  value: number;
  color: string;
}

function CustomTooltip({
  active,
  label,
  payload,
}: {
  active?: boolean;
  label?: string;
  payload?: TooltipPayloadEntry[];
}) {
  if (!active || !payload?.length) return null;

  const total = payload.reduce((sum, p) => sum + p.value, 0);
  const nonZero = payload.filter((p) => p.value > 0);

  return (
    <div className="card px-3 py-2 text-sm max-w-xs" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <p className="font-medium text-stone-900 dark:text-stone-100 mb-1">{label}</p>
      <p className="text-stone-600 dark:text-stone-400 mb-2">{formatCurrency(total)} total</p>
      {nonZero.map((entry) => (
        <div
          key={entry.name}
          className="flex items-center justify-between gap-4 text-xs"
        >
          <span className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full inline-block"
              style={{ backgroundColor: entry.color }}
            />
            {entry.name}
          </span>
          <span className="text-stone-600 dark:text-stone-400">{formatCurrency(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function SpendingTimeline({ data }: SpendingTimelineProps) {
  const { chartData, activeCategories } = useMemo(() => {
    const flat: FlatEntry[] = data.map((d) => ({
      period: d.period,
      total: d.total,
      ...d.byCategory,
    }));

    const active = CATEGORIES.filter((cat) =>
      data.some((d) => d.byCategory[cat] > 0)
    );

    return { chartData: flat, activeCategories: active };
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
          Spending Over Time
        </h2>
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <svg
            aria-hidden="true"
            className="w-10 h-10 text-stone-300"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
            />
          </svg>
          <p className="text-stone-500 text-sm font-medium">No timeline data</p>
          <p className="text-stone-400 text-xs">
            Timeline chart appears when transactions span multiple dates.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-4">
        Spending Over Time
      </h2>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--divider)" opacity={0.5} />
          <XAxis
            dataKey="period"
            tick={{ fontSize: 12, fill: 'var(--muted)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v: number) => formatCurrency(v)}
            tick={{ fontSize: 11, fill: 'var(--muted)' }}
            axisLine={false}
            tickLine={false}
            width={80}
          />
          <Tooltip content={<CustomTooltip />} />
          {activeCategories.map((cat: Category) => (
            <Bar
              key={cat}
              dataKey={cat}
              stackId="spending"
              fill={CATEGORY_CONFIG[cat].color}
              radius={
                cat === activeCategories[activeCategories.length - 1]
                  ? [3, 3, 0, 0]
                  : [0, 0, 0, 0]
              }
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
