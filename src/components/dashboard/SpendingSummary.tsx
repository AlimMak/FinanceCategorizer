'use client';

import { useMemo } from 'react';
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
  icon: string;
}

export function SpendingSummary({ transactions }: SpendingSummaryProps) {
  const stats = useMemo(() => getSummaryStats(transactions), [transactions]);
  const topConfig = CATEGORY_CONFIG[stats.topCategory];

  const cards: CardDef[] = [
    {
      label: 'Total Spent',
      value: formatCurrency(stats.totalSpent),
      color: 'text-red-600',
      icon: '\u2193',
    },
    {
      label: 'Total Income',
      value: formatCurrency(stats.totalIncome),
      color: 'text-green-600',
      icon: '\u2191',
    },
    {
      label: 'Net',
      value: formatCurrency(Math.abs(stats.net)),
      color: stats.net >= 0 ? 'text-green-600' : 'text-red-600',
      sub: stats.net >= 0 ? 'surplus' : 'deficit',
      icon: stats.net >= 0 ? '+' : '-',
    },
    {
      label: 'Transactions',
      value: stats.transactionCount.toLocaleString(),
      color: 'text-gray-900 dark:text-gray-100',
      icon: '#',
    },
    {
      label: 'Date Range',
      value: stats.dateRange.start
        ? `${formatDate(stats.dateRange.start)} \u2013 ${formatDate(stats.dateRange.end)}`
        : 'N/A',
      color: 'text-gray-900 dark:text-gray-100',
      icon: '\u{1F4C5}',
    },
    {
      label: 'Top Category',
      value: `${topConfig.icon} ${stats.topCategory}`,
      color: 'text-gray-900 dark:text-gray-100',
      icon: '\u{1F3C6}',
    },
  ];

  return (
    <dl className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map(({ label, value, color, sub }) => (
        <div
          key={label}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-200"
        >
          <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {label}
          </dt>
          <dd className={`text-xl font-bold mt-1.5 ${color ?? 'text-gray-900'}`}>
            {value}
            {sub && (
              <span className="block text-xs font-normal text-gray-400 mt-0.5">
                {sub}
              </span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
