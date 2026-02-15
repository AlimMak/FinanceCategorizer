import type { Category } from '@/types/transaction';

const BADGE_COLORS: Record<Category, string> = {
  Groceries: 'bg-green-100 text-green-800',
  Dining: 'bg-orange-100 text-orange-800',
  Transport: 'bg-blue-100 text-blue-800',
  Entertainment: 'bg-purple-100 text-purple-800',
  Subscriptions: 'bg-indigo-100 text-indigo-800',
  Housing: 'bg-gray-100 text-gray-800',
  Utilities: 'bg-yellow-100 text-yellow-800',
  Health: 'bg-red-100 text-red-800',
  Shopping: 'bg-pink-100 text-pink-800',
  Income: 'bg-emerald-100 text-emerald-800',
  Transfer: 'bg-cyan-100 text-cyan-800',
  Other: 'bg-slate-100 text-slate-800',
};

interface CategoryBadgeProps {
  category: Category;
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${BADGE_COLORS[category]}`}
    >
      {category}
    </span>
  );
}
