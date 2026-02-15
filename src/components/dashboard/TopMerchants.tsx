'use client';

import type { MerchantSummary } from '@/types/chart';
import { formatCurrency } from '@/utils/format';

interface TopMerchantsProps {
  data: MerchantSummary[];
}

export function TopMerchants({ data }: TopMerchantsProps) {
  if (data.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">Top Merchants</h2>
        <p className="text-gray-400 text-sm mt-4">No merchant data yet.</p>
      </div>
    );
  }

  const maxTotal = data[0].total;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Top Merchants
      </h2>
      <div className="space-y-3">
        {data.map((merchant, idx) => {
          const barWidth = maxTotal > 0 ? (merchant.total / maxTotal) * 100 : 0;

          return (
            <div key={merchant.merchant} className="group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xs font-medium text-gray-400 w-5 text-right flex-shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-sm text-gray-900 truncate">
                    {merchant.merchant}
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                  <span className="text-xs text-gray-400">
                    {merchant.count} txn{merchant.count !== 1 ? 's' : ''}
                  </span>
                  <span className="text-sm font-medium text-gray-900 w-24 text-right">
                    {formatCurrency(merchant.total)}
                  </span>
                </div>
              </div>
              <div className="ml-[30px] h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all"
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
