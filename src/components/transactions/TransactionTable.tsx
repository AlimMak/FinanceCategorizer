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

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const columns: { field: SortField; label: string; align: string }[] = [
    { field: 'date', label: 'Date', align: 'text-left' },
    { field: 'description', label: 'Description', align: 'text-left' },
    { field: 'amount', label: 'Amount', align: 'text-right' },
    { field: 'category', label: 'Category', align: 'text-left' },
  ];

  const getSortLabel = (field: SortField): string => {
    if (sortField !== field) return `Sort by ${field}`;
    return `Sort by ${field}, currently ${sortDir === 'asc' ? 'ascending' : 'descending'}`;
  };

  return (
    <div className="card">
      <div className="p-4 pb-0 flex flex-col sm:flex-row sm:items-center gap-3">
        <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100">
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
          className="border border-stone-300 dark:border-stone-700 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-stone-800 dark:text-stone-100 w-full sm:w-56 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
        />
        <select
          aria-label="Filter by category"
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value as Category | '');
            setPage(0);
          }}
          className="border border-stone-300 dark:border-stone-700 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
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
            <tr className="border-b border-stone-200 dark:border-stone-800">
              {columns.map(({ field, label, align }) => (
                <th
                  key={field}
                  role="columnheader"
                  tabIndex={0}
                  aria-sort={
                    sortField === field
                      ? sortDir === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                  }
                  aria-label={getSortLabel(field)}
                  onClick={() => handleSort(field)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleSort(field);
                    }
                  }}
                  className={`pb-2.5 px-2 font-medium text-stone-500 cursor-pointer select-none hover:text-stone-700 transition-colors ${align}`}
                >
                  {label}
                  <span
                    aria-hidden="true"
                    className={`ml-1 ${sortField === field ? 'text-teal-600' : 'text-stone-300'}`}
                  >
                    {sortField !== field
                      ? '\u2195'
                      : sortDir === 'asc'
                        ? '\u25B2'
                        : '\u25BC'}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((tx) => (
              <tr
                key={tx.id}
                className="border-b border-stone-100 dark:border-stone-800 last:border-0 hover:bg-stone-50/50 dark:hover:bg-stone-800/50 transition-colors"
              >
                <td className="py-2.5 px-2 text-stone-600 dark:text-stone-400 whitespace-nowrap">
                  {formatDate(tx.date)}
                </td>
                <td className="py-2.5 px-2 text-stone-900 dark:text-stone-100 max-w-xs truncate">
                  {tx.description}
                </td>
                <td className="py-2.5 px-2 text-right font-mono whitespace-nowrap">
                  <span className="sr-only">
                    {tx.amount < 0 ? 'Expense' : 'Income'}:
                  </span>
                  <span style={{ color: tx.amount < 0 ? 'var(--color-expense)' : 'var(--color-income)' }}>
                    {formatCurrency(tx.amount)}
                  </span>
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
                  className="py-12 text-center text-sm"
                >
                  <div className="flex flex-col items-center gap-2">
                    <svg
                      aria-hidden="true"
                      className="w-8 h-8 text-stone-300 dark:text-stone-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth="1.5"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                      />
                    </svg>
                    <p className="text-stone-500 dark:text-stone-400 font-medium">
                      No transactions found
                    </p>
                    <p className="text-stone-400 dark:text-stone-500 text-xs">
                      {categoryFilter
                        ? `No transactions in "${categoryFilter}". Try a different category.`
                        : 'Try adjusting your search term.'}
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between px-4 pb-4 text-sm">
        <span className="text-stone-500">
          {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
        </span>
        {totalPages > 1 && (
          <nav aria-label="Transaction table pagination" className="flex items-center gap-2">
            <button
              aria-label="Previous page"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <span className="text-stone-500 px-2" aria-current="page">
              {page + 1} / {totalPages}
            </span>
            <button
              aria-label="Next page"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="px-3 py-1.5 rounded-lg border border-stone-300 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </nav>
        )}
      </div>
    </div>
  );
}
