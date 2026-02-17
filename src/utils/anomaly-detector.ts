import type {
  CategorizedTransaction,
  Category,
  Anomaly,
  AnomalySeverity,
  AnomalyType,
} from '@/types/transaction';
import { formatCurrency } from '@/utils/format';

const SEVERITY_ORDER: Record<AnomalySeverity, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

function daysBetween(a: string, b: string): number {
  const msA = new Date(a + 'T00:00:00').getTime();
  const msB = new Date(b + 'T00:00:00').getTime();
  return Math.abs(msB - msA) / (1000 * 60 * 60 * 24);
}

function isWeekend(dateStr: string): boolean {
  const day = new Date(dateStr + 'T00:00:00').getDay();
  return day === 0 || day === 6;
}

// --- Unusually large for category ---

function detectUnusuallyLarge(
  transactions: CategorizedTransaction[]
): Anomaly[] {
  const byCategory = new Map<Category, CategorizedTransaction[]>();
  for (const tx of transactions) {
    const list = byCategory.get(tx.category) ?? [];
    list.push(tx);
    byCategory.set(tx.category, list);
  }

  const anomalies: Anomaly[] = [];

  for (const [category, txs] of byCategory) {
    if (category === 'Income' || category === 'Transfer') continue;
    if (txs.length < 3) continue;

    const amounts = txs.map((tx) => Math.abs(tx.amount));
    const avg = amounts.reduce((s, a) => s + a, 0) / amounts.length;
    if (avg === 0) continue;

    for (const tx of txs) {
      const absAmount = Math.abs(tx.amount);
      const ratio = absAmount / avg;

      if (ratio > 2) {
        const severity: AnomalySeverity = ratio > 5 ? 'high' : 'medium';
        anomalies.push({
          id: '',
          transactionId: tx.id,
          type: 'unusually_large',
          severity,
          description: `${formatCurrency(absAmount)} is ${ratio.toFixed(1)}x the average ${category} spend of ${formatCurrency(avg)}`,
          amount: tx.amount,
          merchant: tx.description,
          date: tx.date,
        });
      }
    }
  }

  return anomalies;
}

// --- New merchant (one-off > $50) ---

function detectNewMerchant(
  transactions: CategorizedTransaction[]
): Anomaly[] {
  const merchantCounts = new Map<string, CategorizedTransaction[]>();
  for (const tx of transactions) {
    const key = tx.description.trim().toLowerCase();
    const list = merchantCounts.get(key) ?? [];
    list.push(tx);
    merchantCounts.set(key, list);
  }

  const anomalies: Anomaly[] = [];

  for (const [, txs] of merchantCounts) {
    if (txs.length !== 1) continue;
    const tx = txs[0];
    if (Math.abs(tx.amount) <= 50) continue;
    if (tx.category === 'Income' || tx.category === 'Transfer') continue;

    anomalies.push({
      id: '',
      transactionId: tx.id,
      type: 'new_merchant',
      severity: Math.abs(tx.amount) > 200 ? 'medium' : 'low',
      description: `One-time charge of ${formatCurrency(Math.abs(tx.amount))} from a merchant with no other history`,
      amount: tx.amount,
      merchant: tx.description,
      date: tx.date,
    });
  }

  return anomalies;
}

// --- Category spike (month 2x average) ---

function detectCategorySpike(
  transactions: CategorizedTransaction[]
): Anomaly[] {
  const byCategory = new Map<Category, CategorizedTransaction[]>();
  for (const tx of transactions) {
    if (tx.category === 'Income' || tx.category === 'Transfer') continue;
    const list = byCategory.get(tx.category) ?? [];
    list.push(tx);
    byCategory.set(tx.category, list);
  }

  const anomalies: Anomaly[] = [];

  for (const [category, txs] of byCategory) {
    const byMonth = new Map<string, CategorizedTransaction[]>();
    for (const tx of txs) {
      const month = tx.date.slice(0, 7);
      const list = byMonth.get(month) ?? [];
      list.push(tx);
      byMonth.set(month, list);
    }

    if (byMonth.size < 2) continue;

    const monthlyTotals = Array.from(byMonth.entries()).map(
      ([month, mtxs]) => ({
        month,
        total: mtxs.reduce((s, tx) => s + Math.abs(tx.amount), 0),
        txs: mtxs,
      })
    );

    const avg =
      monthlyTotals.reduce((s, m) => s + m.total, 0) / monthlyTotals.length;
    if (avg === 0) continue;

    for (const { month, total, txs: monthTxs } of monthlyTotals) {
      const ratio = total / avg;
      if (ratio <= 2) continue;

      // Flag the largest transaction in that month
      const sorted = [...monthTxs].sort(
        (a, b) => Math.abs(b.amount) - Math.abs(a.amount)
      );
      const biggest = sorted[0];

      anomalies.push({
        id: '',
        transactionId: biggest.id,
        type: 'category_spike',
        severity: ratio > 3 ? 'high' : 'medium',
        description: `${category} spending in ${month} was ${ratio.toFixed(1)}x the monthly average (${formatCurrency(total)} vs ${formatCurrency(avg)})`,
        amount: biggest.amount,
        merchant: biggest.description,
        date: biggest.date,
      });
    }
  }

  return anomalies;
}

// --- Duplicate charges ---

function detectDuplicates(
  transactions: CategorizedTransaction[]
): Anomaly[] {
  const anomalies: Anomaly[] = [];
  const seen = new Set<string>();

  const sorted = [...transactions].sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  for (let i = 0; i < sorted.length; i++) {
    for (let j = i + 1; j < sorted.length; j++) {
      const a = sorted[i];
      const b = sorted[j];

      if (daysBetween(a.date, b.date) > 3) break;

      const keyA = a.description.trim().toLowerCase();
      const keyB = b.description.trim().toLowerCase();

      if (keyA === keyB && a.amount === b.amount) {
        const pairKey = `${a.id}-${b.id}`;
        if (seen.has(pairKey)) continue;
        seen.add(pairKey);

        anomalies.push({
          id: '',
          transactionId: b.id,
          type: 'duplicate',
          severity: 'medium',
          description: `Possible double charge: same merchant and amount (${formatCurrency(Math.abs(a.amount))}) within ${daysBetween(a.date, b.date)} day${daysBetween(a.date, b.date) !== 1 ? 's' : ''}`,
          amount: b.amount,
          merchant: b.description,
          date: b.date,
        });
      }
    }
  }

  return anomalies;
}

// --- Unusual timing (large weekend transactions) ---

function detectUnusualTiming(
  transactions: CategorizedTransaction[]
): Anomaly[] {
  const weekendTxs = transactions.filter(
    (tx) =>
      isWeekend(tx.date) &&
      tx.category !== 'Income' &&
      tx.category !== 'Transfer'
  );

  if (weekendTxs.length < 3) return [];

  const weekendAmounts = weekendTxs.map((tx) => Math.abs(tx.amount));
  const avg =
    weekendAmounts.reduce((s, a) => s + a, 0) / weekendAmounts.length;
  if (avg === 0) return [];

  const anomalies: Anomaly[] = [];

  for (const tx of weekendTxs) {
    const absAmount = Math.abs(tx.amount);
    if (absAmount > avg * 3) {
      anomalies.push({
        id: '',
        transactionId: tx.id,
        type: 'unusual_timing',
        severity: 'low',
        description: `Large weekend charge of ${formatCurrency(absAmount)} — ${(absAmount / avg).toFixed(1)}x your average weekend transaction`,
        amount: tx.amount,
        merchant: tx.description,
        date: tx.date,
      });
    }
  }

  return anomalies;
}

// --- Main orchestrator ---

export function detectAnomalies(
  transactions: CategorizedTransaction[]
): Anomaly[] {
  if (transactions.length === 0) return [];

  const all = [
    ...detectUnusuallyLarge(transactions),
    ...detectNewMerchant(transactions),
    ...detectCategorySpike(transactions),
    ...detectDuplicates(transactions),
    ...detectUnusualTiming(transactions),
  ];

  // Deduplicate: keep highest severity per transaction
  const bestByTx = new Map<string, Anomaly>();
  for (const anomaly of all) {
    const existing = bestByTx.get(anomaly.transactionId);
    if (
      !existing ||
      SEVERITY_ORDER[anomaly.severity] > SEVERITY_ORDER[existing.severity]
    ) {
      bestByTx.set(anomaly.transactionId, anomaly);
    }
  }

  // Assign IDs and sort
  const deduped = Array.from(bestByTx.values());
  deduped.sort((a, b) => {
    const sevDiff = SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity];
    if (sevDiff !== 0) return sevDiff;
    return Math.abs(b.amount) - Math.abs(a.amount);
  });

  return deduped.map((anomaly, i) => ({
    ...anomaly,
    id: `anomaly-${i}`,
  }));
}
