import Papa from 'papaparse';
import type { RawRow } from '@/types/transaction';

export interface ParseResult {
  headers: string[];
  rows: RawRow[];
}

export function parseCsvFile(file: File): Promise<ParseResult> {
  return new Promise((resolve, reject) => {
    Papa.parse<RawRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const headers = result.meta.fields ?? [];
        resolve({ headers, rows: result.data });
      },
      error: (error) => reject(new Error(error.message)),
    });
  });
}
