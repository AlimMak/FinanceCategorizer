'use client';

import { useState } from 'react';
import type { Anomaly, AnomalySeverity, AnomalyType } from '@/types/transaction';
import { formatCurrency, formatDate } from '@/utils/format';

interface AnomalyAlertsProps {
  anomalies: Anomaly[];
}

const INITIAL_VISIBLE = 5;

const SEVERITY_CONFIG: Record<
  AnomalySeverity,
  { dot: string; label: string }
> = {
  high: { dot: 'bg-red-500', label: 'High' },
  medium: { dot: 'bg-amber-400', label: 'Medium' },
  low: { dot: 'bg-sky-400', label: 'Low' },
};

const TYPE_LABELS: Record<AnomalyType, string> = {
  unusually_large: 'Large charge',
  new_merchant: 'New merchant',
  category_spike: 'Category spike',
  duplicate: 'Possible duplicate',
  unusual_timing: 'Unusual timing',
};

export function AnomalyAlerts({ anomalies }: AnomalyAlertsProps) {
  const [expanded, setExpanded] = useState(false);

  if (anomalies.length === 0) {
    return (
      <div className="card p-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center flex-shrink-0">
            <svg
              aria-hidden="true"
              className="w-4.5 h-4.5 text-teal-600 dark:text-teal-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
              No unusual activity detected
            </h2>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>
              All transactions look normal based on your spending patterns.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const visible = expanded
    ? anomalies
    : anomalies.slice(0, INITIAL_VISIBLE);
  const hiddenCount = anomalies.length - INITIAL_VISIBLE;

  return (
    <div className="card p-6">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
          Spending Alerts
        </h2>
        <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400">
          {anomalies.length}
        </span>
      </div>

      <div className="space-y-2">
        {visible.map((anomaly) => {
          const sev = SEVERITY_CONFIG[anomaly.severity];

          return (
            <div
              key={anomaly.id}
              className="flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
            >
              <span
                className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${sev.dot}`}
                title={sev.label}
              />

              <div className="flex-1 min-w-0">
                <p className="text-sm text-stone-900 dark:text-stone-100">
                  {anomaly.description}
                </p>
                <div
                  className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-1 text-xs"
                  style={{ color: 'var(--muted)' }}
                >
                  <span className="truncate max-w-[200px]">
                    {anomaly.merchant}
                  </span>
                  <span className="w-px h-3 bg-stone-300 dark:bg-stone-700" />
                  <span>{formatDate(anomaly.date)}</span>
                  <span className="w-px h-3 bg-stone-300 dark:bg-stone-700" />
                  <span className="font-medium text-stone-700 dark:text-stone-300">
                    {formatCurrency(Math.abs(anomaly.amount))}
                  </span>
                </div>
              </div>

              <span
                className="flex-shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: 'var(--surface)',
                  color: 'var(--muted)',
                }}
              >
                {TYPE_LABELS[anomaly.type]}
              </span>
            </div>
          );
        })}
      </div>

      {hiddenCount > 0 && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="mt-3 text-sm font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 transition-colors"
        >
          Show {hiddenCount} more alert{hiddenCount !== 1 ? 's' : ''}
        </button>
      )}

      {expanded && anomalies.length > INITIAL_VISIBLE && (
        <button
          onClick={() => setExpanded(false)}
          className="mt-3 text-sm font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 transition-colors"
        >
          Show less
        </button>
      )}
    </div>
  );
}
