'use client';

import { FileUpload } from '@/components/upload/FileUpload';
import { ColumnMapper } from '@/components/upload/ColumnMapper';
import { SpendingSummary } from '@/components/dashboard/SpendingSummary';
import { CategoryBreakdown } from '@/components/dashboard/CategoryBreakdown';
import { SpendingTimeline } from '@/components/dashboard/SpendingTimeline';
import { TopMerchants } from '@/components/dashboard/TopMerchants';
import { TransactionTable } from '@/components/transactions/TransactionTable';
import { useTransactions } from '@/hooks/useTransactions';
import {
  getCategoryBreakdown,
  getTimelineData,
  getTopMerchants,
} from '@/utils/data-transform';

export default function HomePage() {
  const {
    step,
    headers,
    columnMapping,
    transactions,
    isLoading,
    error,
    previewRows,
    handleFileUpload,
    handleColumnConfirm,
    handleCategoryOverride,
    handleReset,
  } = useTransactions();

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">
          Personal Finance Categorizer
        </h1>
        {step !== 'upload' && (
          <button
            onClick={handleReset}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            Start over
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {step === 'upload' && (
        <FileUpload onFileSelect={handleFileUpload} isLoading={isLoading} />
      )}

      {step === 'mapping' && (
        <ColumnMapper
          headers={headers}
          initialMapping={columnMapping ?? undefined}
          previewRows={previewRows}
          onMappingComplete={handleColumnConfirm}
          onBack={handleReset}
        />
      )}

      {step === 'categorizing' && (
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 text-lg">Categorizing with AI...</p>
        </div>
      )}

      {step === 'dashboard' && transactions.length > 0 && (
        <div className="space-y-6">
          <SpendingSummary transactions={transactions} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CategoryBreakdown data={getCategoryBreakdown(transactions)} />
            <SpendingTimeline data={getTimelineData(transactions)} />
          </div>
          <TopMerchants data={getTopMerchants(transactions)} />
          <TransactionTable
            transactions={transactions}
            onCategoryOverride={handleCategoryOverride}
          />
        </div>
      )}
    </main>
  );
}
