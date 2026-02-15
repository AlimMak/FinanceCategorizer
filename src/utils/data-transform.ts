import type { CategorizedTransaction } from '@/types/transaction';
import { CATEGORY_CONFIG } from '@/types/transaction';
import type {
  CategoryBreakdownData,
  TimelineData,
  MerchantSummary,
} from '@/types/chart';
import type { Category } from '@/types/transaction';

export function buildCategoryBreakdown(
  transactions: CategorizedTransaction[]
): CategoryBreakdownData[] {
  const totals = new Map<Category, { total: number; count: number }>();

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
    color: CATEGORY_CONFIG[category].color,
  }));
}

const EMPTY_BY_CATEGORY: Record<Category, number> = {
  Groceries: 0,
  Dining: 0,
  Transport: 0,
  Entertainment: 0,
  Subscriptions: 0,
  Housing: 0,
  Utilities: 0,
  Health: 0,
  Shopping: 0,
  Income: 0,
  Transfer: 0,
  Other: 0,
};

export function buildSpendingTimeline(
  transactions: CategorizedTransaction[]
): TimelineData[] {
  const byPeriod = new Map<
    string,
    { total: number; byCategory: Record<Category, number> }
  >();

  for (const tx of transactions) {
    const period = tx.date.slice(0, 7);
    const existing = byPeriod.get(period) ?? {
      total: 0,
      byCategory: { ...EMPTY_BY_CATEGORY },
    };
    byPeriod.set(period, {
      total: existing.total + Math.abs(tx.amount),
      byCategory: {
        ...existing.byCategory,
        [tx.category]:
          existing.byCategory[tx.category] + Math.abs(tx.amount),
      },
    });
  }

  return Array.from(byPeriod.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, { total, byCategory }]) => ({ period, total, byCategory }));
}

export function buildTopMerchants(
  transactions: CategorizedTransaction[],
  limit = 10
): MerchantSummary[] {
  const byMerchant = new Map<string, { total: number; count: number }>();

  for (const tx of transactions) {
    const key = tx.description;
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
