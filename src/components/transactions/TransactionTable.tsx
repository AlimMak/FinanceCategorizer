'use client';

import { useState, useMemo } from 'react';
import type { CategorizedTransaction, Category } from '@/types/transaction';
import { CATEGORIES } from '@/types/transaction';
import { CategoryBadge } from './CategoryBadge';
import { CategoryOverride } from './CategoryOverride';
import { formatCurrency, formatDate } from '@/utils/format';

const PAGE_SIZE = 25;

type SortField = 'date' | 'description' | 'amount' | 'category';
type SortDir = 'asc' | 'desc';

interface TransactionTableProps {
  transactions: CategorizedTransaction[];
  onCategoryOverride: (id: string, category: Category) => void;
}

export function TransactionTable({
  transactions,
  onCategoryOverride,
}: TransactionTableProps) {
  const [page, setPage] = useState(0);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<Category | ''>('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir(field === 'amount' ? 'desc' : 'asc');
    }
    setPage(0);
  };

  const filtered = useMemo(() => {
    let result = transactions;

    if (search) {
      const lower = search.toLowerCase();
      result = result.filter((tx) =>
        tx.description.toLowerCase().includes(lower)
      );
    }

    if (categoryFilter) {
      result = result.filter((tx) => tx.category === categoryFilter);
    }

    const sorted = [...result].sort((a, b) => {
      const mul = sortDir === 'asc' ? 1 : -1;
      switch (sortField) {
        case 'date':
          return mul * a.date.localeCompare(b.date);
        case 'description':
          return mul * a.description.localeCompare(b.description);
        case 'amount':
          return mul * (a.amount - b.amount);
        case 'category':
          return mul * a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });

    return sorted;
  }, [transactions, search, categoryFilter, sortField, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const visible = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const columns: { field: SortField; label: string; align: string }[] = [
    { field: 'date', label: 'Date', align: 'text-left' },
    { field: 'description', label: 'Description', align: 'text-left' },
    { field: 'amount', label: 'Amount', align: 'text-right' },
    { field: 'category', label: 'Category', align: 'text-left' },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
      <div className="p-4 pb-0 flex flex-col sm:flex-row sm:items-center gap-3">
        <h2 className="text-lg font-semibold text-gray-900">
          All Transactions
        </h2>
        <div className="flex-1" />
        <input
          aria-label="Search transactions"
          type="text"
          placeholder="Search descriptions..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-full sm:w-56 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <select
          aria-label="Filter by category"
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value as Category | '');
            setPage(0);
          }}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto p-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              {columns.map(({ field, label, align }) => (
                <th
                  key={field}
                  onClick={() => handleSort(field)}
                  className={`pb-2.5 px-2 font-medium text-gray-500 cursor-pointer select-none hover:text-gray-700 ${align}`}
                >
                  {label}
                  <span className={`ml-1 ${sortField === field ? 'text-blue-500' : 'text-gray-300'}`}>
                    {sortField !== field ? '\u2195' : sortDir === 'asc' ? '\u25B2' : '\u25BC'}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((tx) => (
              <tr
                key={tx.id}
                className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50"
              >
                <td className="py-2.5 px-2 text-gray-600 whitespace-nowrap">
                  {formatDate(tx.date)}
                </td>
                <td className="py-2.5 px-2 text-gray-900 max-w-xs truncate">
                  {tx.description}
                </td>
                <td
                  className={`py-2.5 px-2 text-right font-mono whitespace-nowrap ${
                    tx.amount < 0 ? 'text-red-600' : 'text-green-600'
                  }`}
                >
                  {formatCurrency(tx.amount)}
                </td>
                <td className="py-2.5 px-2">
                  {editingId === tx.id ? (
                    <CategoryOverride
                      transactionId={tx.id}
                      currentCategory={tx.category}
                      isOverridden={tx.isOverridden}
                      onOverride={onCategoryOverride}
                      onClose={() => setEditingId(null)}
                    />
                  ) : (
                    <CategoryBadge
                      category={tx.category}
                      onClick={() => setEditingId(tx.id)}
                    />
                  )}
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-8 text-center text-gray-400 text-sm"
                >
                  No transactions match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 pb-4 text-sm">
          <span className="text-gray-500">
            {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-gray-500 px-2">
              {page + 1} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
