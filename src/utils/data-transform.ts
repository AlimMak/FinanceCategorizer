import type { CategorizedTransaction, Category } from '@/types/transaction';
import { CATEGORY_CONFIG } from '@/types/transaction';
import type {
  CategoryBreakdownData,
  TimelineData,
  MerchantSummary,
} from '@/types/chart';

const EXCLUDED_CATEGORIES: ReadonlySet<Category> = new Set([
  'Income',
  'Transfer',
]);

export function getCategoryBreakdown(
  transactions: CategorizedTransaction[]
): CategoryBreakdownData[] {
  const expenses = transactions.filter(
    (tx) => !EXCLUDED_CATEGORIES.has(tx.category)
  );
  const totals = new Map<Category, { total: number; count: number }>();

  for (const tx of expenses) {
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

  return Array.from(totals.entries())
    .map(([category, { total, count }]) => ({
      category,
      total,
      count,
      percentage: grandTotal > 0 ? (total / grandTotal) * 100 : 0,
      color: CATEGORY_CONFIG[category].color,
    }))
    .sort((a, b) => b.total - a.total);
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

export function getTimelineData(
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

export function getTopMerchants(
  transactions: CategorizedTransaction[],
  limit = 10
): MerchantSummary[] {
  const expenses = transactions.filter(
    (tx) => !EXCLUDED_CATEGORIES.has(tx.category)
  );
  const byKey = new Map<
    string,
    { display: string; total: number; count: number }
  >();

  for (const tx of expenses) {
    const key = tx.description.trim().toLowerCase();
    const existing = byKey.get(key) ?? {
      display: tx.description.trim(),
      total: 0,
      count: 0,
    };
    byKey.set(key, {
      display: existing.display,
      total: existing.total + Math.abs(tx.amount),
      count: existing.count + 1,
    });
  }

  return Array.from(byKey.values())
    .map(({ display, total, count }) => ({
      merchant: display,
      total,
      count,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

export interface SummaryStats {
  totalSpent: number;
  totalIncome: number;
  net: number;
  topCategory: Category;
  transactionCount: number;
  dateRange: { start: string; end: string };
}

export function getSummaryStats(
  transactions: CategorizedTransaction[]
): SummaryStats {
  let totalSpent = 0;
  let totalIncome = 0;
  const categoryTotals = new Map<Category, number>();
  const dates: string[] = [];

  for (const tx of transactions) {
    if (tx.amount < 0) {
      totalSpent += Math.abs(tx.amount);
    } else {
      totalIncome += tx.amount;
    }

    if (!EXCLUDED_CATEGORIES.has(tx.category)) {
      categoryTotals.set(
        tx.category,
        (categoryTotals.get(tx.category) ?? 0) + Math.abs(tx.amount)
      );
    }

    dates.push(tx.date);
  }

  const sorted = [...dates].sort();
  let topCategory: Category = 'Other';
  let topAmount = 0;
  for (const [cat, amount] of categoryTotals) {
    if (amount > topAmount) {
      topAmount = amount;
      topCategory = cat;
    }
  }

  return {
    totalSpent,
    totalIncome,
    net: totalIncome - totalSpent,
    topCategory,
    transactionCount: transactions.length,
    dateRange: {
      start: sorted[0] ?? '',
      end: sorted[sorted.length - 1] ?? '',
    },
  };
}
