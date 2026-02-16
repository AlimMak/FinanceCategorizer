'use client';

import {
  CATEGORIES,
  CATEGORY_CONFIG,
  type Category,
} from '@/types/transaction';

function isValidCategory(value: string): value is Category {
  return (CATEGORIES as readonly string[]).includes(value);
}

interface CategoryOverrideProps {
  transactionId: string;
  currentCategory: Category;
  isOverridden: boolean;
  onOverride: (id: string, category: Category) => void;
  onClose?: () => void;
}

export function CategoryOverride({
  transactionId,
  currentCategory,
  isOverridden,
  onOverride,
  onClose,
}: CategoryOverrideProps) {
  return (
    <div className="flex items-center gap-2">
      <select
        aria-label="Change transaction category"
        value={currentCategory}
        onChange={(e) => {
          if (!isValidCategory(e.target.value)) return;
          onOverride(transactionId, e.target.value);
          onClose?.();
        }}
        className="text-xs border border-stone-300 dark:border-stone-700 rounded-lg px-2 py-1.5 bg-white dark:bg-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
      >
        {CATEGORIES.map((cat) => {
          const config = CATEGORY_CONFIG[cat];
          return (
            <option key={cat} value={cat}>
              {config.icon} {cat}
            </option>
          );
        })}
      </select>
      <span
        className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
          isOverridden
            ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400'
            : 'bg-teal-50 text-teal-600 dark:bg-teal-950/30 dark:text-teal-400'
        }`}
      >
        {isOverridden ? 'Manual' : 'AI'}
      </span>
    </div>
  );
}
