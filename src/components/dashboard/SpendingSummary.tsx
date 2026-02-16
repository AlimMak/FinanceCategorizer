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
  colorVar?: string;
  sub?: string;
  primary?: boolean;
}

export function SpendingSummary({ transactions }: SpendingSummaryProps) {
  const stats = useMemo(() => getSummaryStats(transactions), [transactions]);
  const topConfig = CATEGORY_CONFIG[stats.topCategory];

  const primaryCards: CardDef[] = [
    {
      label: 'Total Spent',
      value: formatCurrency(stats.totalSpent),
      colorVar: 'var(--color-expense)',
      primary: true,
    },
    {
      label: 'Total Income',
      value: formatCurrency(stats.totalIncome),
      colorVar: 'var(--color-income)',
      primary: true,
    },
    {
      label: 'Net',
      value: formatCurrency(Math.abs(stats.net)),
      colorVar: stats.net >= 0 ? 'var(--color-income)' : 'var(--color-expense)',
      sub: stats.net >= 0 ? 'surplus' : 'deficit',
      primary: true,
    },
  ];

  const secondaryCards: CardDef[] = [
    {
      label: 'Transactions',
      value: stats.transactionCount.toLocaleString(),
    },
    {
      label: 'Date Range',
      value: stats.dateRange.start
        ? `${formatDate(stats.dateRange.start)} \u2013 ${formatDate(stats.dateRange.end)}`
        : 'N/A',
    },
    {
      label: 'Top Category',
      value: `${topConfig.icon} ${stats.topCategory}`,
    },
  ];

  return (
    <dl className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {primaryCards.map(({ label, value, colorVar, sub }) => (
        <div key={label} className="card p-4">
          <dt className="text-xs font-light uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
            {label}
          </dt>
          <dd
            className="text-2xl font-bold mt-1.5"
            style={{ color: colorVar }}
          >
            {value}
            {sub && (
              <span className="block text-xs font-normal mt-0.5" style={{ color: 'var(--muted-light)' }}>
                {sub}
              </span>
            )}
          </dd>
        </div>
      ))}
      {secondaryCards.map(({ label, value }) => (
        <div key={label} className="card p-4">
          <dt className="text-xs font-light uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
            {label}
          </dt>
          <dd className="text-base font-semibold mt-1.5 text-stone-900 dark:text-stone-100">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
