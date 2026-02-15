'use client';

import { useState, useCallback } from 'react';
import type { CategorizedTransaction, ColumnMapping } from '@/types/transaction';
import { parseCsvFile } from '@/utils/csv-parser';

export interface TransactionState {
  transactions: CategorizedTransaction[];
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
    async (rows: Record<string, string>[], mapping: ColumnMapping) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const descriptions = rows.map(
          (row) => row[mapping.descriptionColumn] ?? ''
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

        const transactions: CategorizedTransaction[] = rows.map((row, i) => ({
          id: `tx-${i}`,
          date: row[mapping.dateColumn] ?? '',
          description: row[mapping.descriptionColumn] ?? '',
          amount: parseFloat(row[mapping.amountColumn] ?? '0'),
          category: categories[i] as CategorizedTransaction['category'],
          confidence: 1,
          isOverridden: false,
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
    (id: string, category: CategorizedTransaction['category']) => {
      setState((prev) => ({
        ...prev,
        transactions: prev.transactions.map((tx) =>
          tx.id === id ? { ...tx, category, isOverridden: true } : tx
        ),
      }));
    },
    []
  );

  return { ...state, loadFile, categorize, overrideCategory };
}
