'use client';

import type { Subscription } from '@/types/transaction';
import { formatCurrency, formatDate } from '@/utils/format';
import { getMonthlySubscriptionCost } from '@/utils/data-transform';

interface SubscriptionTrackerProps {
  subscriptions: Subscription[];
}

const FREQUENCY_LABELS: Record<Subscription['frequency'], string> = {
  weekly: '/wk',
  monthly: '/mo',
  yearly: '/yr',
};

function ConfidenceDot({ confidence }: { confidence: number }) {
  const isHigh = confidence >= 0.75;
  return (
    <span
      className="flex items-center gap-1 text-[10px] font-medium"
      style={{ color: 'var(--muted)' }}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isHigh ? 'bg-teal-500' : 'bg-amber-400'
        }`}
      />
      {isHigh ? 'High' : 'Medium'}
    </span>
  );
}

export function SubscriptionTracker({
  subscriptions,
}: SubscriptionTrackerProps) {
  const monthlyCost = getMonthlySubscriptionCost(subscriptions);

  if (subscriptions.length === 0) {
    return (
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
          Recurring Subscriptions
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
              d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.678 48.678 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 0 0 3.7 3.7 48.656 48.656 0 0 0 7.324 0 4.006 4.006 0 0 0 3.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3-3 3"
            />
          </svg>
          <p className="text-stone-500 dark:text-stone-400 text-sm font-medium">
            No recurring subscriptions detected
          </p>
          <p className="text-stone-400 dark:text-stone-500 text-xs">
            Upload statements spanning multiple months to detect patterns.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
          Recurring Subscriptions
        </h2>
        <div className="text-right">
          <span
            className="text-sm font-semibold"
            style={{ color: 'var(--color-expense)' }}
          >
            {formatCurrency(monthlyCost)}
          </span>
          <span
            className="text-xs ml-1"
            style={{ color: 'var(--muted)' }}
          >
            /mo est.
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {subscriptions.map((sub) => (
          <div
            key={sub.id}
            className="flex items-center gap-4 rounded-lg px-3 py-2.5 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
          >
            {/* Merchant + frequency */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-stone-900 dark:text-stone-100 truncate">
                  {sub.merchant}
                </span>
                <ConfidenceDot confidence={sub.confidence} />
              </div>
              <div
                className="flex items-center gap-2 mt-0.5 text-xs"
                style={{ color: 'var(--muted)' }}
              >
                <span>
                  {sub.occurrences} charge{sub.occurrences !== 1 ? 's' : ''}
                </span>
                <span className="w-px h-3 bg-stone-300 dark:bg-stone-700" />
                <span>Next: {formatDate(sub.nextExpectedCharge)}</span>
              </div>
            </div>

            {/* Amount + frequency label */}
            <div className="text-right flex-shrink-0">
              <span className="text-sm font-semibold text-stone-900 dark:text-stone-100">
                {formatCurrency(sub.amount)}
              </span>
              <span
                className="text-xs ml-0.5"
                style={{ color: 'var(--muted)' }}
              >
                {FREQUENCY_LABELS[sub.frequency]}
              </span>
              <div
                className="text-xs mt-0.5"
                style={{ color: 'var(--muted)' }}
              >
                {formatCurrency(sub.totalSpent)} total
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
