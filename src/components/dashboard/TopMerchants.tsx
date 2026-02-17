'use client';

import type { MerchantSummary } from '@/types/chart';
import { formatCurrency } from '@/utils/format';

interface TopMerchantsProps {
  data: MerchantSummary[];
}

export function TopMerchants({ data }: TopMerchantsProps) {
  if (data.length === 0) {
    return (
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">Top Merchants</h2>
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
              d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z"
            />
          </svg>
          <p className="text-stone-500 dark:text-stone-400 text-sm font-medium">No merchant data</p>
          <p className="text-stone-400 dark:text-stone-500 text-xs">
            Merchant rankings appear after expenses are categorized.
          </p>
        </div>
      </div>
    );
  }

  const maxTotal = data[0].total;

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-4">
        Top Merchants
      </h2>
      <div className="space-y-3">
        {data.map((merchant, idx) => {
          const barWidth = maxTotal > 0 ? (merchant.total / maxTotal) * 100 : 0;

          return (
            <div
              key={merchant.merchant}
              className="group rounded-lg px-1 py-0.5 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xs font-medium text-stone-400 w-5 text-right flex-shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-sm text-stone-900 dark:text-stone-100 truncate">
                    {merchant.merchant}
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  <span className="text-xs text-stone-400">
                    {merchant.count} txn{merchant.count !== 1 ? 's' : ''}
                  </span>
                  <span className="text-sm font-medium text-stone-900 dark:text-stone-100 w-24 text-right">
                    {formatCurrency(merchant.total)}
                  </span>
                </div>
              </div>
              <div
                className="ml-[30px] h-1.5 rounded-full overflow-hidden"
                style={{ backgroundColor: 'var(--surface)' }}
                role="meter"
                aria-label={`${merchant.merchant}: ${formatCurrency(merchant.total)}`}
                aria-valuenow={Math.round(barWidth)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="h-full bg-teal-600 rounded-full transition-all duration-300 group-hover:bg-teal-700"
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
