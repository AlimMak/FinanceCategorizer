'use client';

import { useState, useCallback, useRef } from 'react';
import type {
  CategorizedTransaction,
  Category,
  ColumnMapping,
} from '@/types/transaction';
import { parseCSV, applyMapping, detectColumns } from '@/utils/csv-parser';
import { categorizeTransactions } from '@/services/categorizer';

type Step = 'upload' | 'mapping' | 'categorizing' | 'dashboard';

interface TransactionState {
  step: Step;
  headers: string[];
  columnMapping: Partial<ColumnMapping> | null;
  transactions: CategorizedTransaction[];
  isLoading: boolean;
  error: string | null;
  pendingCount: number;
}

export interface UseTransactionsResult {
  step: Step;
  headers: string[];
  columnMapping: Partial<ColumnMapping> | null;
  transactions: CategorizedTransaction[];
  isLoading: boolean;
  error: string | null;
  pendingCount: number;
  previewRows: string[][];
  handleFileUpload: (file: File) => Promise<void>;
  handleColumnConfirm: (mapping: ColumnMapping) => Promise<void>;
  handleCategoryOverride: (id: string, category: Category) => void;
  handleReset: () => void;
}

const INITIAL_STATE: TransactionState = {
  step: 'upload',
  headers: [],
  columnMapping: null,
  transactions: [],
  isLoading: false,
  error: null,
  pendingCount: 0,
};

export function useTransactions(): UseTransactionsResult {
  const [state, setState] = useState<TransactionState>(INITIAL_STATE);
  const rawRowsRef = useRef<string[][]>([]);
  const headersRef = useRef<string[]>([]);

  const handleFileUpload = useCallback(async (file: File) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const { headers, rows } = await parseCSV(file);
      const columnMapping = detectColumns(headers);
      rawRowsRef.current = rows;
      headersRef.current = headers;

      setState((prev) => ({
        ...prev,
        step: 'mapping',
        headers,
        columnMapping,
        isLoading: false,
      }));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to parse CSV';
      setState((prev) => ({ ...prev, isLoading: false, error: message }));
    }
  }, []);

  const handleColumnConfirm = useCallback(async (mapping: ColumnMapping) => {
    const currentRows = rawRowsRef.current;
    const currentHeaders = headersRef.current;

    if (currentRows.length === 0 || currentHeaders.length === 0) {
      setState((prev) => ({
        ...prev,
        step: 'upload',
        error: 'No data loaded. Please upload a file first.',
      }));
      return;
    }

    const rawTransactions = applyMapping(currentRows, currentHeaders, mapping);

    if (rawTransactions.length === 0) {
      setState((prev) => ({
        ...prev,
        step: 'mapping',
        error: 'No valid transactions found. Check your column mapping.',
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      step: 'categorizing',
      error: null,
      pendingCount: rawTransactions.length,
    }));

    try {
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

      setState((prev) => ({
        ...prev,
        step: 'dashboard',
        transactions,
      }));
    } catch (err) {
      const warning =
        err instanceof Error ? err.message : 'Categorization failed';

      const fallbackTransactions: CategorizedTransaction[] =
        rawTransactions.map((raw, i) => ({
          ...raw,
          id: `tx-${i}`,
          category: 'Other' as Category,
          confidence: 0,
          isOverridden: false,
        }));

      setState((prev) => ({
        ...prev,
        step: 'dashboard',
        transactions: fallbackTransactions,
        error: `AI categorization failed: ${warning}. All transactions marked as "Other".`,
      }));
    }
  }, []);

  const handleCategoryOverride = useCallback(
    (id: string, category: Category) => {
      setState((prev) => ({
        ...prev,
        transactions: prev.transactions.map((tx) =>
          tx.id === id ? { ...tx, category, isOverridden: true } : tx
        ),
      }));
    },
    []
  );

  const handleReset = useCallback(() => {
    rawRowsRef.current = [];
    headersRef.current = [];
    setState(INITIAL_STATE);
  }, []);

  return {
    step: state.step,
    headers: state.headers,
    columnMapping: state.columnMapping,
    transactions: state.transactions,
    isLoading: state.isLoading,
    error: state.error,
    pendingCount: state.pendingCount,
    previewRows: rawRowsRef.current.slice(0, 5),
    handleFileUpload,
    handleColumnConfirm,
    handleCategoryOverride,
    handleReset,
  };
}
