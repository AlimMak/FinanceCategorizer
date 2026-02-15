'use client';

import type { Category } from '@/types/transaction';
import { CATEGORY_CONFIG } from '@/types/transaction';

interface CategoryBadgeProps {
  category: Category;
  onClick?: () => void;
}

export function CategoryBadge({ category, onClick }: CategoryBadgeProps) {
  const config = CATEGORY_CONFIG[category];

  const classes = [
    'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-colors',
    onClick && 'cursor-pointer hover:opacity-80',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span
      className={classes}
      style={{
        backgroundColor: `${config.color}18`,
        color: config.color,
      }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? `Edit category: ${category}` : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <span aria-hidden="true">{config.icon}</span>
      {category}
    </span>
  );
}
