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
    'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-150',
    onClick && 'cursor-pointer hover:scale-[1.02]',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span
      className={classes}
      style={{
        backgroundColor: `${config.color}20`,
        color: config.color,
        border: `1px solid ${config.color}30`,
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
