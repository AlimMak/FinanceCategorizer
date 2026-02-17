import type {
  CategorizedTransaction,
  Subscription,
  SubscriptionFrequency,
} from '@/types/transaction';

const TRAILING_ID_RE = /[\s#\-_]+[\d]+$/;

function normalizeMerchant(description: string): string {
  return description
    .trim()
    .toLowerCase()
    .replace(TRAILING_ID_RE, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function daysBetween(a: string, b: string): number {
  const msA = new Date(a + 'T00:00:00').getTime();
  const msB = new Date(b + 'T00:00:00').getTime();
  return Math.abs(msB - msA) / (1000 * 60 * 60 * 24);
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

interface FrequencyMatch {
  frequency: SubscriptionFrequency;
  target: number;
  tolerance: number;
}

const FREQUENCY_TARGETS: FrequencyMatch[] = [
  { frequency: 'weekly', target: 7, tolerance: 1 },
  { frequency: 'monthly', target: 30, tolerance: 3 },
  { frequency: 'yearly', target: 365, tolerance: 15 },
];

function detectFrequency(
  intervals: number[]
): { frequency: SubscriptionFrequency; intervalScore: number } | null {
  if (intervals.length === 0) return null;

  const median = [...intervals].sort((a, b) => a - b)[
    Math.floor(intervals.length / 2)
  ];

  for (const { frequency, target, tolerance } of FREQUENCY_TARGETS) {
    if (Math.abs(median - target) <= tolerance) {
      const matchingCount = intervals.filter(
        (iv) => Math.abs(iv - target) <= tolerance
      ).length;
      const intervalScore = matchingCount / intervals.length;
      if (intervalScore >= 0.5) {
        return { frequency, intervalScore };
      }
    }
  }

  return null;
}

function computeAmountConsistency(amounts: number[]): number {
  if (amounts.length <= 1) return 1;

  const avg = amounts.reduce((s, a) => s + a, 0) / amounts.length;
  if (avg === 0) return 0;

  const maxDeviation = Math.max(
    ...amounts.map((a) => Math.abs(a - avg) / Math.abs(avg))
  );

  if (maxDeviation <= 0.05) return 1;
  if (maxDeviation <= 0.1) return 0.9;
  if (maxDeviation <= 0.2) return 0.7;
  if (maxDeviation <= 0.35) return 0.5;
  return 0.3;
}

function frequencyToDays(frequency: SubscriptionFrequency): number {
  switch (frequency) {
    case 'weekly':
      return 7;
    case 'monthly':
      return 30;
    case 'yearly':
      return 365;
  }
}

function toMonthlyCost(amount: number, frequency: SubscriptionFrequency): number {
  switch (frequency) {
    case 'weekly':
      return amount * (52 / 12);
    case 'monthly':
      return amount;
    case 'yearly':
      return amount / 12;
  }
}

export function detectSubscriptions(
  transactions: CategorizedTransaction[]
): Subscription[] {
  // Group by normalized merchant
  const groups = new Map<
    string,
    { display: string; txs: CategorizedTransaction[] }
  >();

  for (const tx of transactions) {
    const key = normalizeMerchant(tx.description);
    const existing = groups.get(key);
    if (existing) {
      existing.txs.push(tx);
    } else {
      groups.set(key, { display: tx.description.trim(), txs: [tx] });
    }
  }

  const subscriptions: Subscription[] = [];
  let idCounter = 0;

  for (const [, { display, txs }] of groups) {
    if (txs.length < 2) continue;

    // Sort by date ascending
    const sorted = [...txs].sort((a, b) => a.date.localeCompare(b.date));

    // Calculate intervals
    const intervals: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      intervals.push(daysBetween(sorted[i - 1].date, sorted[i].date));
    }

    const result = detectFrequency(intervals);
    if (!result) continue;

    const { frequency, intervalScore } = result;

    const amounts = sorted.map((tx) => Math.abs(tx.amount));
    const amountScore = computeAmountConsistency(amounts);

    // Weighted confidence: 60% interval consistency, 40% amount consistency
    const confidence =
      Math.round((intervalScore * 0.6 + amountScore * 0.4) * 100) / 100;

    if (confidence <= 0.5) continue;

    const avgAmount =
      amounts.reduce((s, a) => s + a, 0) / amounts.length;
    const totalSpent =
      amounts.reduce((s, a) => s + a, 0);
    const lastCharge = sorted[sorted.length - 1].date;
    const nextExpectedCharge = addDays(
      lastCharge,
      frequencyToDays(frequency)
    );

    subscriptions.push({
      id: `sub-${idCounter++}`,
      merchant: display,
      amount: Math.round(avgAmount * 100) / 100,
      frequency,
      confidence,
      lastCharge,
      nextExpectedCharge,
      totalSpent: Math.round(totalSpent * 100) / 100,
      occurrences: sorted.length,
      transactionIds: sorted.map((tx) => tx.id),
    });
  }

  // Sort by monthly cost descending
  return subscriptions.sort(
    (a, b) =>
      toMonthlyCost(b.amount, b.frequency) -
      toMonthlyCost(a.amount, a.frequency)
  );
}
