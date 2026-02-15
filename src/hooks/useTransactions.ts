'use client';

import { useState, useCallback } from 'react';
import type { CategorizedTransaction, ColumnMapping } from '@/types/transaction';
import { parseCSV, applyMapping } from '@/utils/csv-parser';
import { categorizeTransactions } from '@/services/categorizer';

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
      const { headers, rows } = await parseCSV(file);
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
    async (
      rows: string[][],
      headers: string[],
      mapping: ColumnMapping
    ) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const rawTransactions = applyMapping(rows, headers, mapping);
        const results = await categorizeTransactions(rawTransactions);

        const transactions: CategorizedTransaction[] = rawTransactions.map(
          (raw, i) => ({
            ...raw,
            id: `tx-${i}`,
            category: results[i].category,
            confidence: results[i].confidence,
            isOverridden: false,
          })
        );

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
