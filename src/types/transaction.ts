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

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: Category;
  merchant: string;
}

export interface MappedColumn {
  date: string;
  description: string;
  amount: string;
  merchant?: string;
}

export interface RawRow {
  [key: string]: string;
}
