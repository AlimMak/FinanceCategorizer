'use client';

import type { MappedColumn } from '@/types/transaction';

interface ColumnMapperProps {
  headers: string[];
  onMappingComplete: (mapping: MappedColumn) => void;
}

export function ColumnMapper({
  headers,
  onMappingComplete,
}: ColumnMapperProps) {
  const fields: (keyof MappedColumn)[] = [
    'date',
    'description',
    'amount',
    'merchant',
  ];

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const mapping: MappedColumn = {
      date: formData.get('date') as string,
      description: formData.get('description') as string,
      amount: formData.get('amount') as string,
      merchant: (formData.get('merchant') as string) || undefined,
    };
    onMappingComplete(mapping);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-lg font-semibold">Map Your CSV Columns</h2>
      {fields.map((field) => (
        <div key={field} className="flex items-center gap-4">
          <label className="w-32 text-sm font-medium capitalize">
            {field}
          </label>
          <select
            name={field}
            className="border rounded px-2 py-1 text-sm"
          >
            {field === 'merchant' && (
              <option value="">-- optional --</option>
            )}
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
