'use client';

import { useState, useMemo } from 'react';
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
    pendingCount,
    previewRows,
    handleFileUpload,
    handleColumnConfirm,
    handleCategoryOverride,
    handleReset,
  } = useTransactions();

  const [showTable, setShowTable] = useState(true);

  const categoryBreakdown = useMemo(
    () => getCategoryBreakdown(transactions),
    [transactions]
  );
  const timelineData = useMemo(
    () => getTimelineData(transactions),
    [transactions]
  );
  const topMerchants = useMemo(
    () => getTopMerchants(transactions),
    [transactions]
  );

  return (
    <div className="min-h-screen">
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <svg
              aria-hidden="true"
              className="w-7 h-7 text-blue-600"
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="2"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
              />
            </svg>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              FinSort
            </h1>
          </div>

          {step !== 'upload' && (
            <button
              onClick={handleReset}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              Start over
            </button>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {error && (
          <div
            role="alert"
            className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm flex items-start gap-3"
          >
            <svg
              aria-hidden="true"
              className="w-5 h-5 flex-shrink-0 mt-0.5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
              />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {step === 'upload' && (
          <div className="max-w-2xl mx-auto pt-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Categorize your transactions
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                Upload a CSV from your bank and let AI sort your spending.
              </p>
            </div>
            <FileUpload onFileSelect={handleFileUpload} isLoading={isLoading} />
          </div>
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
          <div
            role="status"
            aria-live="polite"
            className="flex flex-col items-center justify-center py-20 space-y-5"
          >
            <div className="relative">
              <div className="w-14 h-14 border-[3px] border-blue-200 dark:border-blue-900 rounded-full" />
              <div className="absolute inset-0 w-14 h-14 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-gray-900 dark:text-gray-100 text-lg font-medium">
                Categorizing {pendingCount} transaction
                {pendingCount !== 1 ? 's' : ''}...
              </p>
              <p className="text-gray-400 text-sm">
                AI is analyzing your spending patterns
              </p>
            </div>
          </div>
        )}

        {step === 'dashboard' && transactions.length > 0 && (
          <div className="space-y-6">
            <SpendingSummary transactions={transactions} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CategoryBreakdown data={categoryBreakdown} />
              <SpendingTimeline data={timelineData} />
            </div>

            <TopMerchants data={topMerchants} />

            <div>
              <button
                onClick={() => setShowTable((v) => !v)}
                aria-expanded={showTable}
                className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 mb-3 transition-colors"
              >
                <svg
                  aria-hidden="true"
                  className={`w-4 h-4 transition-transform duration-200 ${showTable ? 'rotate-90' : ''}`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z"
                    clipRule="evenodd"
                  />
                </svg>
                {showTable ? 'Hide' : 'Show'} all transactions
              </button>
              {showTable && (
                <TransactionTable
                  transactions={transactions}
                  onCategoryOverride={handleCategoryOverride}
                />
              )}
            </div>

            <div className="flex justify-center pt-4 pb-8">
              <button
                onClick={handleReset}
                className="px-6 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 transition-colors shadow-sm"
              >
                Upload New File
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
