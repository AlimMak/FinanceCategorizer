'use client';

import type { ColumnMapping } from '@/types/transaction';

interface ColumnMapperProps {
  headers: string[];
  onMappingComplete: (mapping: ColumnMapping) => void;
}

export function ColumnMapper({
  headers,
  onMappingComplete,
}: ColumnMapperProps) {
  const fields: { key: keyof ColumnMapping; label: string; optional: boolean }[] = [
    { key: 'dateColumn', label: 'Date', optional: false },
    { key: 'descriptionColumn', label: 'Description', optional: false },
    { key: 'amountColumn', label: 'Amount', optional: false },
    { key: 'categoryColumn', label: 'Category', optional: true },
  ];

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const mapping: ColumnMapping = {
      dateColumn: formData.get('dateColumn') as string,
      descriptionColumn: formData.get('descriptionColumn') as string,
      amountColumn: formData.get('amountColumn') as string,
      categoryColumn:
        (formData.get('categoryColumn') as string) || undefined,
    };
    onMappingComplete(mapping);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-lg font-semibold">Map Your CSV Columns</h2>
      {fields.map(({ key, label, optional }) => (
        <div key={key} className="flex items-center gap-4">
          <label className="w-32 text-sm font-medium">{label}</label>
          <select name={key} className="border rounded px-2 py-1 text-sm">
            {optional && <option value="">-- optional --</option>}
            {headers.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </div>
      ))}
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Categorize Transactions
      </button>
    </form>
  );
}
