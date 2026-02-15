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
import type { CategoryBreakdownData } from '@/types/chart';
import { formatCurrency, formatPercentage } from '@/utils/format';

interface CategoryBreakdownProps {
  data: CategoryBreakdownData[];
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
              const entry = props as PieLabelRenderProps & CategoryBreakdownData;
              return `${entry.category} ${formatPercentage(entry.percentage)}`;
            }}
          >
            {data.map((entry) => (
              <Cell key={entry.category} fill={entry.color} />
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
