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
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="font-medium" style={{ color: config.color }}>
        {config.icon} {d.category}
      </p>
      <p className="text-gray-700 dark:text-gray-300">
        {formatCurrency(d.total)} ({d.count} transaction{d.count !== 1 ? 's' : ''})
      </p>
      <p className="text-gray-500 dark:text-gray-400">{formatPercent(d.percentage)}</p>
    </div>
  );
}

export function CategoryBreakdown({ data }: CategoryBreakdownProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Spending by Category
        </h2>
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <svg
            aria-hidden="true"
            className="w-10 h-10 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z"
            />
          </svg>
          <p className="text-gray-500 text-sm font-medium">No expense data</p>
          <p className="text-gray-400 text-xs">
            All transactions are income or transfers.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
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
            paddingAngle={data.length > 1 ? 2 : 0}
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
            <div
              key={entry.category}
              className="flex items-center gap-3 rounded-lg px-1 py-0.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="text-sm w-5 text-center" aria-hidden="true">
                {config.icon}
              </span>
              <span className="text-sm text-gray-700 dark:text-gray-300 w-28 truncate">
                {entry.category}
              </span>
              <div
                className="flex-1 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden"
                role="meter"
                aria-label={`${entry.category}: ${formatPercent(entry.percentage)}`}
                aria-valuenow={Math.round(entry.percentage)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${entry.percentage}%`,
                    backgroundColor: entry.color,
                  }}
                />
              </div>
              <span className="text-xs text-gray-500 w-12 text-right">
                {formatPercent(entry.percentage)}
              </span>
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-20 text-right">
                {formatCurrency(entry.total)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
