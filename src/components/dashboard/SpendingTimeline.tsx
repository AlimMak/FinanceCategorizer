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
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm max-w-xs">
      <p className="font-medium text-gray-900 mb-1">{label}</p>
      <p className="text-gray-600 mb-2">{formatCurrency(total)} total</p>
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
          <span className="text-gray-600">{formatCurrency(entry.value)}</span>
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
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          Spending Over Time
        </h2>
        <p className="text-gray-400 text-sm mt-4">No timeline data yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Spending Over Time
      </h2>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="period"
            tick={{ fontSize: 12, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v: number) => formatCurrency(v)}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
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
