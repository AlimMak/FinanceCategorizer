import type { Transaction } from '@/types/transaction';
import type {
  ChartDataPoint,
  TimelineEntry,
  MerchantSummary,
} from '@/types/chart';

export function buildCategoryBreakdown(
  transactions: Transaction[]
): ChartDataPoint[] {
  const totals = new Map<string, { total: number; count: number }>();

  for (const tx of transactions) {
    const existing = totals.get(tx.category) ?? { total: 0, count: 0 };
    totals.set(tx.category, {
      total: existing.total + Math.abs(tx.amount),
      count: existing.count + 1,
    });
  }

  const grandTotal = Array.from(totals.values()).reduce(
    (sum, v) => sum + v.total,
    0
  );

  return Array.from(totals.entries()).map(([category, { total, count }]) => ({
    category,
    total,
    count,
    percentage: grandTotal > 0 ? (total / grandTotal) * 100 : 0,
  }));
}

export function buildSpendingTimeline(
  transactions: Transaction[]
): TimelineEntry[] {
  const byPeriod = new Map<string, number>();

  for (const tx of transactions) {
    const period = tx.date.slice(0, 7);
    byPeriod.set(
      period,
      (byPeriod.get(period) ?? 0) + Math.abs(tx.amount)
    );
  }

  return Array.from(byPeriod.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, total]) => ({ period, total }));
}

export function buildTopMerchants(
  transactions: Transaction[],
  limit = 10
): MerchantSummary[] {
  const byMerchant = new Map<string, { total: number; count: number }>();

  for (const tx of transactions) {
    const key = tx.merchant || tx.description;
    const existing = byMerchant.get(key) ?? { total: 0, count: 0 };
    byMerchant.set(key, {
      total: existing.total + Math.abs(tx.amount),
      count: existing.count + 1,
    });
  }

  return Array.from(byMerchant.entries())
    .map(([merchant, { total, count }]) => ({ merchant, total, count }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}
