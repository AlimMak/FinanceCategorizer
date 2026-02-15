'use client';

import { useState } from 'react';
import { FileUpload } from '@/components/upload/FileUpload';
import { ColumnMapper } from '@/components/upload/ColumnMapper';
import { SpendingSummary } from '@/components/dashboard/SpendingSummary';
import { CategoryBreakdown } from '@/components/dashboard/CategoryBreakdown';
import { SpendingTimeline } from '@/components/dashboard/SpendingTimeline';
import { TopMerchants } from '@/components/dashboard/TopMerchants';
import { TransactionTable } from '@/components/transactions/TransactionTable';
import { useTransactions } from '@/hooks/useTransactions';
import {
  buildCategoryBreakdown,
  buildSpendingTimeline,
  buildTopMerchants,
} from '@/utils/data-transform';

type Step = 'upload' | 'map' | 'dashboard';

export default function HomePage() {
  const [step, setStep] = useState<Step>('upload');
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const {
    transactions,
    isLoading,
    error,
    headers,
    loadFile,
    categorize,
    overrideCategory,
  } = useTransactions();

  const handleFileSelect = async (file: File) => {
    const result = await loadFile(file);
    if (result) {
      setRawRows(result.rows);
      setStep('map');
    }
  };

  const handleMappingComplete = async (
    mapping: Parameters<typeof categorize>[1]
  ) => {
    await categorize(rawRows, mapping);
    setStep('dashboard');
  };

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-3xl font-bold text-gray-900">
        Personal Finance Categorizer
      </h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {step === 'upload' && (
        <FileUpload onFileSelect={handleFileSelect} isLoading={isLoading} />
      )}

      {step === 'map' && (
        <ColumnMapper
          headers={headers}
          onMappingComplete={handleMappingComplete}
        />
      )}

      {step === 'dashboard' && transactions.length > 0 && (
        <div className="space-y-6">
          <SpendingSummary transactions={transactions} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CategoryBreakdown
              data={buildCategoryBreakdown(transactions)}
            />
            <SpendingTimeline
              data={buildSpendingTimeline(transactions)}
            />
          </div>
          <TopMerchants data={buildTopMerchants(transactions)} />
          <TransactionTable
            transactions={transactions}
            onCategoryOverride={overrideCategory}
          />
        </div>
      )}
    </main>
  );
}
