export type Category =
  | 'Groceries'
  | 'Dining'
  | 'Transport'
  | 'Entertainment'
  | 'Subscriptions'
  | 'Housing'
  | 'Utilities'
  | 'Health'
  | 'Shopping'
  | 'Income'
  | 'Transfer'
  | 'Other';

export const CATEGORIES: Category[] = [
  'Groceries',
  'Dining',
  'Transport',
  'Entertainment',
  'Subscriptions',
  'Housing',
  'Utilities',
  'Health',
  'Shopping',
  'Income',
  'Transfer',
  'Other',
];

export interface RawTransaction {
  date: string;
  description: string;
  amount: number;
  rawCategory?: string;
}

export interface CategoryConfig {
  name: Category;
  color: string;
  icon: string;
}

export interface CategorizedTransaction extends RawTransaction {
  id: string;
  category: Category;
  confidence: number;
  isOverridden: boolean;
}

export interface ColumnMapping {
  dateColumn: string;
  descriptionColumn: string;
  amountColumn: string;
  categoryColumn?: string;
}

export const CATEGORY_CONFIG: Record<Category, CategoryConfig> = {
  Groceries: { name: 'Groceries', color: '#22c55e', icon: '\u{1F6D2}' },
  Dining: { name: 'Dining', color: '#f97316', icon: '\u{1F37D}\u{FE0F}' },
  Transport: { name: 'Transport', color: '#3b82f6', icon: '\u{1F697}' },
  Entertainment: { name: 'Entertainment', color: '#a855f7', icon: '\u{1F3AC}' },
  Subscriptions: { name: 'Subscriptions', color: '#6366f1', icon: '\u{1F504}' },
  Housing: { name: 'Housing', color: '#64748b', icon: '\u{1F3E0}' },
  Utilities: { name: 'Utilities', color: '#eab308', icon: '\u{1F4A1}' },
  Health: { name: 'Health', color: '#ef4444', icon: '\u{1F3E5}' },
  Shopping: { name: 'Shopping', color: '#ec4899', icon: '\u{1F6CD}\u{FE0F}' },
  Income: { name: 'Income', color: '#10b981', icon: '\u{1F4B0}' },
  Transfer: { name: 'Transfer', color: '#06b6d4', icon: '\u{1F501}' },
  Other: { name: 'Other', color: '#94a3b8', icon: '\u{1F4CB}' },
};
