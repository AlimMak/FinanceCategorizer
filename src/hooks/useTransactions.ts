'use client';

import { useState, useCallback } from 'react';
import type { Transaction, MappedColumn } from '@/types/transaction';
import { parseCsvFile } from '@/utils/csv-parser';

export interface TransactionState {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  headers: string[];
}

export function useTransactions() {
  const [state, setState] = useState<TransactionState>({
    transactions: [],
    isLoading: false,
    error: null,
    headers: [],
  });

  const loadFile = useCallback(async (file: File) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const { headers, rows } = await parseCsvFile(file);
      setState((prev) => ({ ...prev, headers, isLoading: false }));
      return { headers, rows };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to parse CSV';
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
      return null;
    }
  }, []);

  const categorize = useCallback(
    async (rows: Record<string, string>[], mapping: MappedColumn) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const descriptions = rows.map(
          (row) => row[mapping.description] ?? ''
        );
        const response = await fetch('/api/categorize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ descriptions }),
        });

        if (!response.ok) {
          throw new Error('Categorization request failed');
        }

        const { categories }: { categories: string[] } =
          await response.json();

        const transactions: Transaction[] = rows.map((row, i) => ({
          id: `tx-${i}`,
          date: row[mapping.date] ?? '',
          description: row[mapping.description] ?? '',
          amount: parseFloat(row[mapping.amount] ?? '0'),
          category: categories[i] as Transaction['category'],
          merchant:
            row[mapping.merchant ?? ''] ??
            row[mapping.description] ??
            '',
        }));

        setState((prev) => ({ ...prev, transactions, isLoading: false }));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Categorization failed';
        setState((prev) => ({ ...prev, isLoading: false, error: message }));
      }
    },
    []
  );

  const overrideCategory = useCallback(
    (id: string, category: Transaction['category']) => {
      setState((prev) => ({
        ...prev,
        transactions: prev.transactions.map((tx) =>
          tx.id === id ? { ...tx, category } : tx
        ),
      }));
    },
    []
  );

  return { ...state, loadFile, categorize, overrideCategory };
}
