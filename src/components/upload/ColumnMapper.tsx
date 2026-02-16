'use client';

import { useState, useMemo } from 'react';
import type { ColumnMapping } from '@/types/transaction';

interface ColumnMapperProps {
  headers: string[];
  initialMapping?: Partial<ColumnMapping>;
  previewRows?: string[][];
  onMappingComplete: (mapping: ColumnMapping) => void;
  onBack?: () => void;
}

const FIELDS: {
  key: keyof ColumnMapping;
  label: string;
  required: boolean;
}[] = [
  { key: 'dateColumn', label: 'Date Column', required: true },
  { key: 'descriptionColumn', label: 'Description Column', required: true },
  { key: 'amountColumn', label: 'Amount Column', required: true },
  { key: 'categoryColumn', label: 'Category Column', required: false },
];

export function ColumnMapper({
  headers,
  initialMapping,
  previewRows = [],
  onMappingComplete,
  onBack,
}: ColumnMapperProps) {
  const [mapping, setMapping] = useState<Record<string, string>>({
    dateColumn: initialMapping?.dateColumn ?? '',
    descriptionColumn: initialMapping?.descriptionColumn ?? '',
    amountColumn: initialMapping?.amountColumn ?? '',
    categoryColumn: initialMapping?.categoryColumn ?? '',
  });

  const isValid =
    mapping.dateColumn && mapping.descriptionColumn && mapping.amountColumn;

  const handleChange = (key: string, value: string) => {
    setMapping((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    onMappingComplete({
      dateColumn: mapping.dateColumn,
      descriptionColumn: mapping.descriptionColumn,
      amountColumn: mapping.amountColumn,
      categoryColumn: mapping.categoryColumn || undefined,
    });
  };

  const previewData = useMemo(() => {
    if (previewRows.length === 0 || !isValid) return [];

    const dateIdx = headers.indexOf(mapping.dateColumn);
    const descIdx = headers.indexOf(mapping.descriptionColumn);
    const amountIdx = headers.indexOf(mapping.amountColumn);

    return previewRows.slice(0, 3).map((row) => ({
      date: dateIdx >= 0 ? (row[dateIdx] ?? '') : '',
      description: descIdx >= 0 ? (row[descIdx] ?? '') : '',
      amount: amountIdx >= 0 ? (row[amountIdx] ?? '') : '',
    }));
  }, [previewRows, headers, mapping, isValid]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Map Your Columns
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Tell us which columns contain your transaction data.
          {headers.length > 0 && (
            <span className="text-gray-400">
              {' '}
              Found {headers.length} columns in your file.
            </span>
          )}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          {FIELDS.map(({ key, label, required }) => (
            <div key={key} className="space-y-1.5">
              <label
                htmlFor={key}
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {label}
                {required && <span className="text-red-500 ml-0.5">*</span>}
              </label>
              <select
                id={key}
                value={mapping[key]}
                onChange={(e) => handleChange(key, e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 transition-colors ${
                  required && !mapping[key]
                    ? 'border-gray-300 dark:border-gray-700 text-gray-400'
                    : 'border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
              >
                <option value="">
                  {required ? '-- Select column --' : '-- Optional --'}
                </option>
                {headers.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      </div>

      {previewData.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Preview
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="text-left py-2 px-3 font-medium text-gray-500">
                    Date
                  </th>
                  <th className="text-left py-2 px-3 font-medium text-gray-500">
                    Description
                  </th>
                  <th className="text-right py-2 px-3 font-medium text-gray-500">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {previewData.map((row, i) => (
                  <tr
                    key={i}
                    className="border-b border-gray-100 dark:border-gray-800 last:border-0"
                  >
                    <td className="py-2 px-3 text-gray-600 whitespace-nowrap">
                      {row.date || '--'}
                    </td>
                    <td className="py-2 px-3 text-gray-900 dark:text-gray-100 truncate max-w-[250px]">
                      {row.description || '--'}
                    </td>
                    <td className="py-2 px-3 text-gray-600 text-right whitespace-nowrap font-mono">
                      {row.amount || '--'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 transition-colors"
          >
            Back
          </button>
        )}
        <button
          type="submit"
          disabled={!isValid}
          className={`px-6 py-2.5 text-sm font-medium rounded-lg transition-colors shadow-sm ${
            isValid
              ? 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
          }`}
        >
          Looks good, categorize!
        </button>
      </div>
    </form>
  );
}
