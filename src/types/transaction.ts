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
  Groceries: { name: 'Groceries', color: '#5ba888', icon: '\u{1F6D2}' },
  Dining: { name: 'Dining', color: '#d4956a', icon: '\u{1F37D}\u{FE0F}' },
  Transport: { name: 'Transport', color: '#6b8cae', icon: '\u{1F697}' },
  Entertainment: { name: 'Entertainment', color: '#9b7cb8', icon: '\u{1F3AC}' },
  Subscriptions: { name: 'Subscriptions', color: '#7c82b8', icon: '\u{1F504}' },
  Housing: { name: 'Housing', color: '#8a8e99', icon: '\u{1F3E0}' },
  Utilities: { name: 'Utilities', color: '#c4a85a', icon: '\u{1F4A1}' },
  Health: { name: 'Health', color: '#c47272', icon: '\u{1F3E5}' },
  Shopping: { name: 'Shopping', color: '#b87c9b', icon: '\u{1F6CD}\u{FE0F}' },
  Income: { name: 'Income', color: '#4a9e7e', icon: '\u{1F4B0}' },
  Transfer: { name: 'Transfer', color: '#6ba3b0', icon: '\u{1F501}' },
  Other: { name: 'Other', color: '#9ca0a8', icon: '\u{1F4CB}' },
};
