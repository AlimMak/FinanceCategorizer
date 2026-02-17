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
    <div className="card px-3 py-2 text-sm" style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <p className="font-medium" style={{ color: config.color }}>
        {config.icon} {d.category}
      </p>
      <p className="text-stone-700 dark:text-stone-300">
        {formatCurrency(d.total)} ({d.count} transaction{d.count !== 1 ? 's' : ''})
      </p>
      <p style={{ color: 'var(--muted)' }}>{formatPercent(d.percentage)}</p>
    </div>
  );
}

export function CategoryBreakdown({ data }: CategoryBreakdownProps) {
  if (data.length === 0) {
    return (
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
          Spending by Category
        </h2>
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <svg
            aria-hidden="true"
            className="w-10 h-10 text-stone-300 dark:text-stone-600"
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
          <p className="text-stone-500 dark:text-stone-400 text-sm font-medium">No expense data</p>
          <p className="text-stone-400 dark:text-stone-500 text-xs">
            All transactions are income or transfers.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-4">
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
            innerRadius={65}
            outerRadius={95}
            paddingAngle={data.length > 1 ? 3 : 0}
            stroke="var(--card)"
            strokeWidth={2}
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
              className="flex items-center gap-3 rounded-lg px-1 py-0.5 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
            >
              <span className="text-sm w-5 text-center" aria-hidden="true">
                {config.icon}
              </span>
              <span className="text-sm text-stone-700 dark:text-stone-300 w-28 truncate">
                {entry.category}
              </span>
              <div
                className="flex-1 h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: 'var(--surface)' }}
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
              <span className="text-xs w-12 text-right" style={{ color: 'var(--muted)' }}>
                {formatPercent(entry.percentage)}
              </span>
              <span className="text-xs font-medium text-stone-700 dark:text-stone-300 w-20 text-right">
                {formatCurrency(entry.total)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
