import type { CategorizedTransaction } from '@/types/transaction';
import { formatCurrency } from '@/utils/format';

interface SpendingSummaryProps {
  transactions: CategorizedTransaction[];
}

export function SpendingSummary({ transactions }: SpendingSummaryProps) {
  const expenses = transactions.filter((tx) => tx.amount < 0);
  const income = transactions.filter((tx) => tx.amount > 0);
  const totalExpenses = expenses.reduce(
    (sum, tx) => sum + Math.abs(tx.amount),
    0
  );
  const totalIncome = income.reduce((sum, tx) => sum + tx.amount, 0);

  const cards = [
    { label: 'Total Expenses', value: formatCurrency(totalExpenses) },
    { label: 'Total Income', value: formatCurrency(totalIncome) },
    { label: 'Net', value: formatCurrency(totalIncome - totalExpenses) },
    { label: 'Transactions', value: transactions.length.toString() },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map(({ label, value }) => (
        <div key={label} className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-semibold mt-1">{value}</p>
        </div>
      ))}
    </div>
  );
}
