'use client';

import type { CategorizedTransaction } from '@/types/transaction';
import { CATEGORY_CONFIG } from '@/types/transaction';
import { getSummaryStats } from '@/utils/data-transform';
import { formatCurrency, formatDate } from '@/utils/format';

interface SpendingSummaryProps {
  transactions: CategorizedTransaction[];
}

interface CardDef {
  label: string;
  value: string;
  color?: string;
  sub?: string;
}

export function SpendingSummary({ transactions }: SpendingSummaryProps) {
  const stats = getSummaryStats(transactions);
  const topConfig = CATEGORY_CONFIG[stats.topCategory];

  const cards: CardDef[] = [
    {
      label: 'Total Spent',
      value: formatCurrency(stats.totalSpent),
      color: 'text-red-600',
    },
    {
      label: 'Total Income',
      value: formatCurrency(stats.totalIncome),
      color: 'text-green-600',
    },
    {
      label: 'Net',
      value: formatCurrency(Math.abs(stats.net)),
      color: stats.net >= 0 ? 'text-green-600' : 'text-red-600',
      sub: stats.net >= 0 ? 'surplus' : 'deficit',
    },
    {
      label: 'Transactions',
      value: stats.transactionCount.toLocaleString(),
      color: 'text-gray-900',
    },
    {
      label: 'Date Range',
      value: stats.dateRange.start
        ? `${formatDate(stats.dateRange.start)} - ${formatDate(stats.dateRange.end)}`
        : 'N/A',
      color: 'text-gray-900',
    },
    {
      label: 'Top Category',
      value: `${topConfig.icon} ${stats.topCategory}`,
      color: 'text-gray-900',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map(({ label, value, color, sub }) => (
        <div
          key={label}
          className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
        >
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {label}
          </p>
          <p className={`text-xl font-bold mt-1.5 ${color ?? 'text-gray-900'}`}>
            {value}
          </p>
          {sub && (
            <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
          )}
        </div>
      ))}
    </div>
  );
}
