import Papa from 'papaparse';
import type { ColumnMapping, RawTransaction } from '@/types/transaction';

// Max 5000 rows to prevent memory exhaustion
const MAX_CSV_ROWS = 5000;

export interface ParseResult {
  headers: string[];
  rows: string[][];
}

export function parseCSV(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse<string[]>(file, {
      header: false,
      skipEmptyLines: true,
      complete: (result) => {
        if (result.data.length === 0) {
          reject(new Error('the file appears to be empty'));
          return;
        }
        const [headerRow, ...rows] = result.data;
        if (headerRow.length === 0 || headerRow.every((h) => !h.trim())) {
          reject(new Error('no column headers found in the first row'));
          return;
        }

        // Validate row count
        if (rows.length > MAX_CSV_ROWS) {
          reject(
            new Error(
              `too many rows (${rows.length}). maximum ${MAX_CSV_ROWS} rows allowed`
            )
          );
          return;
        }

        if (rows.length === 0) {
          reject(new Error('the file has headers but no data rows'));
          return;
        }
        const headers = headerRow.map((h) => h.replace(/^\uFEFF/, '').trim());
        resolve({ headers, rows });
      },
      error: (error) => reject(new Error(error.message)),
    });
  });
}

const DATE_KEYWORDS = ['date', 'posted', 'trans date', 'transaction date'];
const DESC_KEYWORDS = ['description', 'merchant', 'name', 'memo', 'payee', 'narration'];
const AMOUNT_KEYWORDS = ['amount', 'debit', 'credit', 'total', 'sum', 'value'];
const CATEGORY_KEYWORDS = ['category', 'type', 'classification'];

function matchColumn(header: string, keywords: string[]): boolean {
  const lower = header.toLowerCase().trim();
  return keywords.some((kw) => lower.includes(kw));
}

export function detectColumns(headers: string[]): Partial<ColumnMapping> {
  const mapping: Partial<ColumnMapping> = {};

  for (const header of headers) {
    if (!mapping.dateColumn && matchColumn(header, DATE_KEYWORDS)) {
      mapping.dateColumn = header;
    } else if (!mapping.descriptionColumn && matchColumn(header, DESC_KEYWORDS)) {
      mapping.descriptionColumn = header;
    } else if (!mapping.amountColumn && matchColumn(header, AMOUNT_KEYWORDS)) {
      mapping.amountColumn = header;
    } else if (!mapping.categoryColumn && matchColumn(header, CATEGORY_KEYWORDS)) {
      mapping.categoryColumn = header;
    }
  }

  return mapping;
}

function parseAmount(raw: string): number | null {
  if (!raw || !raw.trim()) return null;
  let cleaned = raw.trim();

  const isNegParens = cleaned.startsWith('(') && cleaned.endsWith(')');
  if (isNegParens) {
    cleaned = cleaned.slice(1, -1);
  }

  cleaned = cleaned.replace(/[$,]/g, '');
  const value = parseFloat(cleaned);
  if (isNaN(value)) return null;

  return isNegParens ? -value : value;
}

function parseDate(raw: string): string | null {
  if (!raw || !raw.trim()) return null;
  const trimmed = raw.trim();

  // YYYY-MM-DD
  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // MM/DD/YYYY or DD/MM/YYYY
  const slashFull = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashFull) {
    const [, first, second, year] = slashFull;
    const a = parseInt(first, 10);
    const b = parseInt(second, 10);

    if (a >= 1 && a <= 12 && b >= 1 && b <= 31) {
      return `${year}-${first.padStart(2, '0')}-${second.padStart(2, '0')}`;
    }
    if (b >= 1 && b <= 12 && a >= 1 && a <= 31) {
      return `${year}-${second.padStart(2, '0')}-${first.padStart(2, '0')}`;
    }
  }

  // M/D/YY
  const slashShort = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
  if (slashShort) {
    const [, month, day, shortYear] = slashShort;
    const y = parseInt(shortYear, 10);
    const fullYear = y >= 50 ? `19${shortYear}` : `20${shortYear}`;
    const m = parseInt(month, 10);
    const d = parseInt(day, 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }

  return null;
}

export function applyMapping(
  rows: string[][],
  headers: string[],
  mapping: ColumnMapping
): RawTransaction[] {
  const dateIdx = headers.indexOf(mapping.dateColumn);
  const descIdx = headers.indexOf(mapping.descriptionColumn);
  const amountIdx = headers.indexOf(mapping.amountColumn);
  const catIdx = mapping.categoryColumn
    ? headers.indexOf(mapping.categoryColumn)
    : -1;

  if (dateIdx === -1 || descIdx === -1 || amountIdx === -1) {
    return [];
  }

  const transactions: RawTransaction[] = [];

  for (const row of rows) {
    const date = parseDate(row[dateIdx] ?? '');
    const amount = parseAmount(row[amountIdx] ?? '');
    const description = (row[descIdx] ?? '').trim();

    if (!date || amount === null || !description) continue;

    const tx: RawTransaction = { date, description, amount };
    if (catIdx !== -1 && row[catIdx]?.trim()) {
      tx.rawCategory = row[catIdx].trim();
    }

    transactions.push(tx);
  }

  return transactions;
}
