'use client';

import { useState } from 'react';
import type { CategorizedTransaction } from '@/types/transaction';
import { CategoryBadge } from './CategoryBadge';
import { CategoryOverride } from './CategoryOverride';
import { formatCurrency, formatDate } from '@/utils/format';

const PAGE_SIZE = 25;

interface TransactionTableProps {
  transactions: CategorizedTransaction[];
  onCategoryOverride: (
    id: string,
    category: CategorizedTransaction['category']
  ) => void;
}

export function TransactionTable({
  transactions,
  onCategoryOverride,
}: TransactionTableProps) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(transactions.length / PAGE_SIZE);
  const visible = transactions.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE
  );

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold mb-4">All Transactions</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="pb-2">Date</th>
              <th className="pb-2">Description</th>
              <th className="pb-2 text-right">Amount</th>
              <th className="pb-2">Category</th>
              <th className="pb-2">Override</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((tx) => (
              <tr key={tx.id} className="border-b last:border-0">
                <td className="py-2 whitespace-nowrap">
                  {formatDate(tx.date)}
                </td>
                <td className="py-2 max-w-xs truncate">
                  {tx.description}
                </td>
                <td
                  className={`py-2 text-right ${
                    tx.amount < 0 ? 'text-red-600' : 'text-green-600'
                  }`}
                >
                  {formatCurrency(tx.amount)}
                </td>
                <td className="py-2">
                  <CategoryBadge category={tx.category} />
                </td>
                <td className="py-2">
                  <CategoryOverride
                    transactionId={tx.id}
                    currentCategory={tx.category}
                    onOverride={onCategoryOverride}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4 text-sm">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1 rounded border disabled:opacity-50"
          >
            Previous
          </button>
          <span>
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() =>
              setPage((p) => Math.min(totalPages - 1, p + 1))
            }
            disabled={page === totalPages - 1}
            className="px-3 py-1 rounded border disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
