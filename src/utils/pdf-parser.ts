import type { ParseResult } from './csv-parser';

interface PdfTextItem {
  str: string;
  transform: number[];
  hasEOL: boolean;
}

const Y_TOLERANCE = 2;

// Max lines from PDF to prevent memory exhaustion (safety limit)
const MAX_PDF_LINES = 10000;

const DATE_RE =
  /^(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?|\d{4}-\d{2}-\d{2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{1,2}(?:[,\s]+\d{4})?)\s/i;

const AMOUNT_RE =
  /[-−]?\$?\s?[\d,]+\.\d{2}|\(\$?\s?[\d,]+\.\d{2}\)/;

const SKIP_RE =
  /^(?:opening balance|closing balance|beginning balance|ending balance|statement period|account (?:number|summary)|page \d+|continued (?:on|from)|subtotal|total (?:debits|credits|charges|deposits|withdrawals|fees)|balance forward|previous balance|new balance|interest charged|minimum payment|payment due|thank you|customer service)/i;

function extractLinesFromItems(items: PdfTextItem[]): string[] {
  if (items.length === 0) return [];

  const lineMap = new Map<number, { x: number; text: string }[]>();

  for (const item of items) {
    if (!item.str) continue;
    const y = Math.round(item.transform[5] / Y_TOLERANCE) * Y_TOLERANCE;
    const x = item.transform[4];

    const bucket = lineMap.get(y);
    if (bucket) {
      bucket.push({ x, text: item.str });
    } else {
      lineMap.set(y, [{ x, text: item.str }]);
    }
  }

  const sortedYs = [...lineMap.keys()].sort((a, b) => b - a);

  return sortedYs.map((y) => {
    const segments = lineMap.get(y)!;
    segments.sort((a, b) => a.x - b.x);
    return segments.map((s) => s.text).join(' ').trim();
  });
}

function normalizeDate(raw: string): string {
  const trimmed = raw.trim().replace(/,/g, '');

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return trimmed;

  const slashFull = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashFull) {
    const [, m, d, y] = slashFull;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  const slashShort = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
  if (slashShort) {
    const [, m, d, yy] = slashShort;
    const century = parseInt(yy, 10) >= 50 ? '19' : '20';
    return `${century}${yy}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  const slashNoYear = trimmed.match(/^(\d{1,2})\/(\d{1,2})$/);
  if (slashNoYear) {
    const [, m, d] = slashNoYear;
    const year = new Date().getFullYear();
    return `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  const MONTHS: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  };
  const namedMatch = trimmed.match(
    /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+(\d{1,2})(?:\s+(\d{4}))?$/i
  );
  if (namedMatch) {
    const [, monthStr, day, year] = namedMatch;
    const mm = MONTHS[monthStr.slice(0, 3).toLowerCase()];
    const yyyy = year ?? String(new Date().getFullYear());
    return `${yyyy}-${mm}-${day.padStart(2, '0')}`;
  }

  return trimmed;
}

function parseAmount(raw: string): number | null {
  let cleaned = raw.trim();

  const isParenNeg = cleaned.startsWith('(') && cleaned.endsWith(')');
  if (isParenNeg) {
    cleaned = cleaned.slice(1, -1);
  }

  const hasLeadingMinus = /^[-−]/.test(cleaned);
  cleaned = cleaned.replace(/[-−$,\s]/g, '');

  const value = parseFloat(cleaned);
  if (isNaN(value)) return null;

  return isParenNeg || hasLeadingMinus ? -value : value;
}

function resolveAmounts(amounts: RegExpExecArray[]): number {
  if (amounts.length === 1) {
    return parseAmount(amounts[0][0]) ?? 0;
  }

  if (amounts.length === 2) {
    const a = parseAmount(amounts[0][0]) ?? 0;
    const b = parseAmount(amounts[1][0]) ?? 0;

    if (a !== 0 && b === 0) return -Math.abs(a);
    if (a === 0 && b !== 0) return Math.abs(b);

    return parseAmount(amounts[amounts.length - 1][0]) ?? 0;
  }

  return parseAmount(amounts[amounts.length - 1][0]) ?? 0;
}

interface RawTx {
  readonly date: string;
  readonly description: string;
  readonly amount: string;
}

function parseTransactionLines(lines: string[]): RawTx[] {
  const transactions: RawTx[] = [];
  let pendingTx: RawTx | null = null;

  for (const line of lines) {
    if (!line.trim()) continue;

    if (SKIP_RE.test(line)) continue;

    const dateMatch = line.match(DATE_RE);
    if (dateMatch) {
      if (pendingTx && pendingTx.description) {
        transactions.push(pendingTx);
      }
      pendingTx = null;

      const dateStr = dateMatch[1];
      const rest = line.slice(dateMatch[0].length).trim();

      const amounts = [...rest.matchAll(new RegExp(AMOUNT_RE.source, 'g'))];

      if (amounts.length === 0) {
        pendingTx = {
          date: normalizeDate(dateStr),
          description: rest,
          amount: '0',
        };
        continue;
      }

      const firstAmount = amounts[0];
      const description = rest.slice(0, firstAmount.index!).replace(/\s{2,}/g, ' ').trim();

      if (!description) {
        pendingTx = {
          date: normalizeDate(dateStr),
          description: '',
          amount: String(resolveAmounts(amounts)),
        };
        continue;
      }

      transactions.push({
        date: normalizeDate(dateStr),
        description,
        amount: String(resolveAmounts(amounts)),
      });
    } else if (pendingTx) {
      const amounts = [...line.matchAll(new RegExp(AMOUNT_RE.source, 'g'))];

      if (amounts.length > 0) {
        const descPart = line.slice(0, amounts[0].index!).trim();
        const fullDesc = pendingTx.description
          ? `${pendingTx.description} ${descPart}`.trim()
          : descPart;

        const resolvedAmount = pendingTx.amount === '0'
          ? resolveAmounts(amounts)
          : (parseAmount(pendingTx.amount) ?? resolveAmounts(amounts));

        if (fullDesc) {
          transactions.push({
            date: pendingTx.date,
            description: fullDesc,
            amount: String(resolvedAmount),
          });
        }
        pendingTx = null;
      } else {
        pendingTx = {
          ...pendingTx,
          description: `${pendingTx.description} ${line.trim()}`.trim(),
        };
      }
    }
  }

  if (pendingTx && pendingTx.description && pendingTx.amount !== '0') {
    transactions.push(pendingTx);
  }

  return transactions;
}

let workerConfigured = false;

export async function parsePDF(file: File): Promise<ParseResult> {
  const pdfjsLib = await import('pdfjs-dist');

  if (!workerConfigured) {
    // Configure worker to use local bundled version instead of CDN
    // This prevents supply chain attacks from external CDN
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      '/pdfjs-worker.min.mjs';
    workerConfigured = true;
  }

  const arrayBuffer = await file.arrayBuffer();

  const pdf = await pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
  }).promise;

  const allLines: string[] = [];
  let totalTextLength = 0;

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();

    const textItems = content.items
      .filter((item) => 'str' in item && typeof item.str === 'string')
      .map((item) => item as unknown as PdfTextItem);

    totalTextLength += textItems.reduce((sum, item) => sum + item.str.length, 0);
    const pageLines = extractLinesFromItems(textItems);
    allLines.push(...pageLines);

    // Check line limit to prevent memory exhaustion
    if (allLines.length > MAX_PDF_LINES) {
      throw new Error(
        'PDF is too large or complex to process. Please try a CSV export from your bank instead.'
      );
    }
  }

  if (totalTextLength < 20) {
    throw new Error(
      'Unable to extract text from this PDF. Please ensure it is a text-based PDF (not a scanned image) and try a CSV export from your bank instead.'
    );
  }

  const transactions = parseTransactionLines(allLines);

  if (transactions.length === 0) {
    throw new Error(
      'No transactions could be found in this PDF. The format may not be supported. Please try a CSV export from your bank instead.'
    );
  }

  const headers = ['Date', 'Description', 'Amount'];
  const rows = transactions.map((tx) => [tx.date, tx.description, tx.amount]);

  return { headers, rows };
}
