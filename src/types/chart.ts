import type { Category } from './transaction';

export interface CategoryBreakdownData {
  category: Category;
  total: number;
  percentage: number;
  count: number;
  color: string;
}

export interface TimelineData {
  period: string;
  total: number;
  byCategory: Record<Category, number>;
}

export interface MerchantSummary {
  merchant: string;
  total: number;
  count: number;
}
