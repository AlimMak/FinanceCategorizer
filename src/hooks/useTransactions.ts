'use client';

import { useState, useCallback } from 'react';
import type {
  CategorizedTransaction,
  Category,
  ColumnMapping,
  RawTransaction,
} from '@/types/transaction';
import { parseCSV, applyMapping, detectColumns } from '@/utils/csv-parser';
import { categorizeTransactions } from '@/services/categorizer';

type Step = 'upload' | 'processing' | 'dashboard';

interface TransactionState {
  step: Step;
  transactions: CategorizedTransaction[];
  isLoading: boolean;
  error: string | null;
  statusMessage: string;
}

export interface UseTransactionsResult {
  step: Step;
  transactions: CategorizedTransaction[];
  isLoading: boolean;
  error: string | null;
  statusMessage: string;
  handleFileUpload: (file: File) => Promise<void>;
  handleCategoryOverride: (id: string, category: Category) => void;
  handleReset: () => void;
}

const INITIAL_STATE: TransactionState = {
  step: 'upload',
  transactions: [],
  isLoading: false,
  error: null,
  statusMessage: '',
};

const PDF_MAPPING: ColumnMapping = {
  dateColumn: 'Date',
  descriptionColumn: 'Description',
  amountColumn: 'Amount',
};

function isPdfFile(file: File): boolean {
  return file.name.toLowerCase().endsWith('.pdf');
}

function resolveMapping(
  headers: string[]
): ColumnMapping {
  const detected = detectColumns(headers);

  return {
    dateColumn: detected.dateColumn ?? headers[0] ?? '',
    descriptionColumn: detected.descriptionColumn ?? headers[1] ?? '',
    amountColumn: detected.amountColumn ?? headers[2] ?? '',
    categoryColumn: detected.categoryColumn,
  };
}

export function useTransactions(): UseTransactionsResult {
  const [state, setState] = useState<TransactionState>(INITIAL_STATE);

  const runCategorization = useCallback(
    async (rawTransactions: RawTransaction[]) => {
      setState((prev) => ({
        ...prev,
        statusMessage: `Categorizing ${rawTransactions.length} transaction${rawTransactions.length !== 1 ? 's' : ''}...`,
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
          isLoading: false,
          statusMessage: '',
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
          isLoading: false,
          statusMessage: '',
          error: `AI categorization failed: ${warning}. All transactions marked as "Other".`,
        }));
      }
    },
    []
  );

  const handleFileUpload = useCallback(
    async (file: File) => {
      setState((prev) => ({
        ...prev,
        step: 'processing',
        isLoading: true,
        error: null,
        statusMessage: 'Parsing your file...',
      }));

      if (isPdfFile(file)) {
        let rawTransactions: RawTransaction[];

        try {
          const { parsePDF } = await import('@/utils/pdf-parser');
          const { headers, rows } = await parsePDF(file);
          rawTransactions = applyMapping(rows, headers, PDF_MAPPING);
        } catch (err) {
          const raw = err instanceof Error ? err.message : 'Unknown error';
          setState((prev) => ({
            ...prev,
            step: 'upload',
            isLoading: false,
            statusMessage: '',
            error: `PDF parsing failed \u2014 ${raw}`,
          }));
          return;
        }

        if (rawTransactions.length === 0) {
          setState((prev) => ({
            ...prev,
            step: 'upload',
            isLoading: false,
            statusMessage: '',
            error:
              'No valid transactions found in the PDF. Try using a CSV export from your bank instead.',
          }));
          return;
        }

        await runCategorization(rawTransactions);
        return;
      }

      // CSV flow — fully automatic
      let rawTransactions: RawTransaction[];

      try {
        const { headers, rows } = await parseCSV(file);
        const mapping = resolveMapping(headers);
        rawTransactions = applyMapping(rows, headers, mapping);
      } catch (err) {
        const raw = err instanceof Error ? err.message : 'Unknown error';
        setState((prev) => ({
          ...prev,
          step: 'upload',
          isLoading: false,
          statusMessage: '',
          error: `CSV parsing failed \u2014 ${raw}. Check that your file has column headers in the first row.`,
        }));
        return;
      }

      if (rawTransactions.length === 0) {
        setState((prev) => ({
          ...prev,
          step: 'upload',
          isLoading: false,
          statusMessage: '',
          error:
            'No valid transactions found. Check that your CSV has date, description, and amount columns.',
        }));
        return;
      }

      await runCategorization(rawTransactions);
    },
    [runCategorization]
  );

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
    setState(INITIAL_STATE);
  }, []);

  return {
    step: state.step,
    transactions: state.transactions,
    isLoading: state.isLoading,
    error: state.error,
    statusMessage: state.statusMessage,
    handleFileUpload,
    handleCategoryOverride,
    handleReset,
  };
}
