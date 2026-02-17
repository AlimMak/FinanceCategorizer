'use client';

import { useState, useMemo, useCallback } from 'react';
import { FileUpload } from '@/components/upload/FileUpload';
import { SpendingSummary } from '@/components/dashboard/SpendingSummary';
import { CategoryBreakdown } from '@/components/dashboard/CategoryBreakdown';
import { SpendingTimeline } from '@/components/dashboard/SpendingTimeline';
import { TopMerchants } from '@/components/dashboard/TopMerchants';
import { SubscriptionTracker } from '@/components/dashboard/SubscriptionTracker';
import { TransactionTable } from '@/components/transactions/TransactionTable';
import { useTransactions } from '@/hooks/useTransactions';
import { useTheme } from '@/hooks/useTheme';
import {
  getCategoryBreakdown,
  getTimelineData,
  getTopMerchants,
  getSummaryStats,
} from '@/utils/data-transform';
import { detectSubscriptions } from '@/utils/subscription-detector';
import { detectAnomalies } from '@/utils/anomaly-detector';
import { AnomalyAlerts } from '@/components/dashboard/AnomalyAlerts';

export default function HomePage() {
  const {
    step,
    transactions,
    isLoading,
    error,
    statusMessage,
    handleFileUpload,
    handleCategoryOverride,
    handleReset,
  } = useTransactions();

  const { theme, toggleTheme } = useTheme();
  const [showTable, setShowTable] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

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
  const summaryStats = useMemo(
    () => getSummaryStats(transactions),
    [transactions]
  );
  const subscriptions = useMemo(
    () => detectSubscriptions(transactions),
    [transactions]
  );
  const anomalies = useMemo(
    () => detectAnomalies(transactions),
    [transactions]
  );

  const handleExportPDF = useCallback(async () => {
    setIsExporting(true);
    try {
      const { exportDashboardPDF } = await import('@/utils/pdf-export');
      await exportDashboardPDF({
        transactions,
        stats: summaryStats,
        categoryBreakdown,
        topMerchants,
      });
    } catch {
      // PDF generation failed silently — user sees no download
    } finally {
      setIsExporting(false);
    }
  }, [transactions, summaryStats, categoryBreakdown, topMerchants]);

  return (
    <div className="min-h-screen">
      <header className="border-b border-stone-200 dark:border-stone-800 bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm sticky top-0 z-10 transition-colors duration-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <svg
              aria-hidden="true"
              className="w-7 h-7 text-teal-600"
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
            <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100">
              FinSort
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {step === 'dashboard' && transactions.length > 0 && (
              <>
                <button
                  onClick={handleExportPDF}
                  disabled={isExporting}
                  className="flex items-center gap-1.5 text-sm font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 transition-colors disabled:opacity-50"
                >
                  {isExporting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-[2px] border-teal-600 dark:border-teal-400 border-t-transparent rounded-full animate-spin" />
                      Generating report...
                    </>
                  ) : (
                    <>
                      <svg
                        aria-hidden="true"
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
                        />
                      </svg>
                      Export PDF
                    </>
                  )}
                </button>
                <span className="w-px h-4 bg-stone-300 dark:bg-stone-700" />
              </>
            )}

            {step !== 'upload' && !isLoading && (
              <>
                <button
                  onClick={handleReset}
                  className="text-sm text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 transition-colors"
                >
                  Start over
                </button>
                <span className="w-px h-4 bg-stone-300 dark:bg-stone-700" />
              </>
            )}

            <button
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="p-1.5 rounded-lg text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              {theme === 'dark' ? (
                <svg
                  aria-hidden="true"
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
                  />
                </svg>
              ) : (
                <svg
                  aria-hidden="true"
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {error && step !== 'processing' && (
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
              <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                Categorize your transactions
              </h2>
              <p className="text-stone-500 dark:text-stone-400 mt-2">
                Upload a CSV or PDF bank statement and let AI sort your
                spending.
              </p>
            </div>
            <FileUpload onFileSelect={handleFileUpload} isLoading={isLoading} />
          </div>
        )}

        {step === 'processing' && (
          <div
            role="status"
            aria-live="polite"
            className="flex flex-col items-center justify-center py-24 space-y-8"
          >
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full border-[3px] border-stone-200 dark:border-stone-800" />
              <div className="absolute inset-0 rounded-full border-[3px] border-teal-600 border-t-transparent animate-spin" />
              <div className="absolute inset-2 rounded-full border-[2px] border-teal-400/30 border-b-transparent animate-spin [animation-direction:reverse] [animation-duration:1.5s]" />
            </div>

            <div className="text-center space-y-2">
              <p className="text-stone-900 dark:text-stone-100 text-lg font-medium">
                {statusMessage || 'Processing...'}
              </p>
              <p className="text-stone-400 dark:text-stone-500 text-sm">
                This usually takes a few seconds
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs text-stone-400 dark:text-stone-500">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                Secure
              </span>
              <span className="w-px h-3 bg-stone-300 dark:bg-stone-700" />
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                AI-powered
              </span>
              <span className="w-px h-3 bg-stone-300 dark:bg-stone-700" />
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                Private
              </span>
            </div>
          </div>
        )}

        {step === 'dashboard' && transactions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <svg
              aria-hidden="true"
              className="w-12 h-12 text-stone-300 dark:text-stone-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Zm3.75 11.625a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"
              />
            </svg>
            <p className="text-stone-500 dark:text-stone-400 font-medium">
              No transactions to display
            </p>
            <p className="text-stone-400 dark:text-stone-500 text-sm">
              The file was processed but no valid transactions were found.
            </p>
            <button
              onClick={handleReset}
              className="mt-2 px-6 py-2.5 text-sm font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700 active:bg-teal-800 transition-colors"
            >
              Try another file
            </button>
          </div>
        )}

        {step === 'dashboard' && transactions.length > 0 && (
          <div className="space-y-6">
            <SpendingSummary transactions={transactions} />

            <AnomalyAlerts anomalies={anomalies} />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CategoryBreakdown data={categoryBreakdown} />
              <SpendingTimeline data={timelineData} />
            </div>

            <TopMerchants data={topMerchants} />

            <SubscriptionTracker subscriptions={subscriptions} />

            <div>
              <button
                onClick={() => setShowTable((v) => !v)}
                aria-expanded={showTable}
                className="flex items-center gap-2 text-sm font-medium text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200 mb-3 transition-colors"
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
                className="px-6 py-2.5 text-sm font-medium text-stone-600 dark:text-stone-400 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-700 active:bg-stone-100 transition-colors"
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
