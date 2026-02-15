'use client';

import { CATEGORIES, type Category } from '@/types/transaction';

interface CategoryOverrideProps {
  transactionId: string;
  currentCategory: Category;
  onOverride: (id: string, category: Category) => void;
}

export function CategoryOverride({
  transactionId,
  currentCategory,
  onOverride,
}: CategoryOverrideProps) {
  return (
    <select
      value={currentCategory}
      onChange={(e) =>
        onOverride(transactionId, e.target.value as Category)
      }
      className="text-xs border rounded px-1 py-0.5"
    >
      {CATEGORIES.map((cat) => (
        <option key={cat} value={cat}>
          {cat}
        </option>
      ))}
    </select>
  );
}
