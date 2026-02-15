import type { RawTransaction, Category } from '@/types/transaction';

const BATCH_SIZE = 50;

interface CategorizationResult {
  category: Category;
  confidence: number;
}

interface ApiResult {
  index: number;
  category: Category;
  confidence: number;
}

const FALLBACK: CategorizationResult = { category: 'Other', confidence: 0 };

async function categorizeBatch(
  transactions: RawTransaction[]
): Promise<CategorizationResult[]> {
  try {
    const response = await fetch('/api/categorize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transactions: transactions.map((tx) => ({
          description: tx.description,
          amount: tx.amount,
        })),
      }),
    });

    if (!response.ok) {
      return transactions.map(() => ({ ...FALLBACK }));
    }

    const { results }: { results: ApiResult[] } = await response.json();

    const mapped = new Map<number, CategorizationResult>();
    for (const r of results) {
      mapped.set(r.index, { category: r.category, confidence: r.confidence });
    }

    return transactions.map((_, i) => mapped.get(i) ?? { ...FALLBACK });
  } catch {
    return transactions.map(() => ({ ...FALLBACK }));
  }
}

export async function categorizeTransactions(
  transactions: RawTransaction[]
): Promise<CategorizationResult[]> {
  if (transactions.length === 0) return [];

  const batches: RawTransaction[][] = [];
  for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
    batches.push(transactions.slice(i, i + BATCH_SIZE));
  }

  const batchResults = await Promise.all(batches.map(categorizeBatch));

  return batchResults.flat();
}
