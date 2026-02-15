'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { CategoryBreakdownData } from '@/types/chart';
import { CATEGORY_CONFIG } from '@/types/transaction';
import { formatCurrency, formatPercent } from '@/utils/format';

interface CategoryBreakdownProps {
  data: CategoryBreakdownData[];
}

interface TooltipPayloadEntry {
  payload: CategoryBreakdownData;
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadEntry[];
}) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload;
  const config = CATEGORY_CONFIG[d.category];

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="font-medium" style={{ color: config.color }}>
        {config.icon} {d.category}
      </p>
      <p className="text-gray-700">{formatCurrency(d.total)}</p>
      <p className="text-gray-500">{formatPercent(d.percentage)}</p>
    </div>
  );
}

export function CategoryBreakdown({ data }: CategoryBreakdownProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          Spending by Category
        </h2>
        <p className="text-gray-400 text-sm mt-4">No expense data to show.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Spending by Category
      </h2>

      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={data}
            dataKey="total"
            nameKey="category"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            strokeWidth={0}
          >
            {data.map((entry) => (
              <Cell key={entry.category} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      <div className="mt-4 space-y-2.5">
        {data.map((entry) => {
          const config = CATEGORY_CONFIG[entry.category];
          return (
            <div key={entry.category} className="flex items-center gap-3">
              <span className="text-sm w-5 text-center" aria-hidden="true">
                {config.icon}
              </span>
              <span className="text-sm text-gray-700 w-28 truncate">
                {entry.category}
              </span>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${entry.percentage}%`,
                    backgroundColor: entry.color,
                  }}
                />
              </div>
              <span className="text-xs text-gray-500 w-12 text-right">
                {formatPercent(entry.percentage)}
              </span>
              <span className="text-xs font-medium text-gray-700 w-20 text-right">
                {formatCurrency(entry.total)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
