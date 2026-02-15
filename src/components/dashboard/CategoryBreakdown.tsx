'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { PieLabelRenderProps } from 'recharts';
import type { ChartDataPoint } from '@/types/chart';
import { formatCurrency, formatPercentage } from '@/utils/format';

const COLORS = [
  '#6366f1',
  '#f59e0b',
  '#10b981',
  '#f43f5e',
  '#3b82f6',
  '#a78bfa',
  '#34d399',
  '#fb923c',
  '#e879f9',
  '#38bdf8',
  '#4ade80',
  '#94a3b8',
];

interface CategoryBreakdownProps {
  data: ChartDataPoint[];
}

export function CategoryBreakdown({ data }: CategoryBreakdownProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold mb-4">Spending by Category</h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            dataKey="total"
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={(props: PieLabelRenderProps) => {
              const entry = props as PieLabelRenderProps & ChartDataPoint;
              return `${entry.category} ${formatPercentage(entry.percentage)}`;
            }}
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => formatCurrency(value as number)}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
