import { jsPDF } from 'jspdf';
import { CATEGORY_CONFIG, type Category } from '@/types/transaction';
import type { CategorizedTransaction } from '@/types/transaction';
import type { CategoryBreakdownData, MerchantSummary } from '@/types/chart';
import type { SummaryStats } from '@/utils/data-transform';

const PAGE_WIDTH = 210;
const MARGIN = 20;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const TEAL = [13, 148, 136] as const; // teal-600
const STONE_900 = [28, 25, 23] as const;
const STONE_500 = [120, 113, 108] as const;
const STONE_200 = [231, 229, 228] as const;

export interface ExportData {
  transactions: CategorizedTransaction[];
  stats: SummaryStats;
  categoryBreakdown: CategoryBreakdownData[];
  topMerchants: MerchantSummary[];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatReportDate(dateStr: string): string {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr + 'T00:00:00');
  if (isNaN(date.getTime())) return dateStr;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

function ensurePageSpace(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > 280) {
    doc.addPage();
    return 20;
  }
  return y;
}

function drawSectionHeader(doc: jsPDF, title: string, y: number): number {
  const startY = ensurePageSpace(doc, y, 20);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...STONE_900);
  doc.text(title, MARGIN, startY);

  doc.setDrawColor(...TEAL);
  doc.setLineWidth(0.8);
  doc.line(MARGIN, startY + 2, MARGIN + CONTENT_WIDTH, startY + 2);

  return startY + 10;
}

function drawTableHeader(
  doc: jsPDF,
  columns: { label: string; x: number; width: number; align?: 'right' | 'left' }[],
  y: number
): number {
  const startY = ensurePageSpace(doc, y, 12);

  doc.setFillColor(...STONE_200);
  doc.rect(MARGIN, startY - 4, CONTENT_WIDTH, 8, 'F');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...STONE_500);

  for (const col of columns) {
    if (col.align === 'right') {
      doc.text(col.label, col.x + col.width, startY, { align: 'right' });
    } else {
      doc.text(col.label, col.x, startY);
    }
  }

  return startY + 8;
}

export async function exportDashboardPDF(data: ExportData): Promise<void> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = 20;

  // Title
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...TEAL);
  doc.text('FinSort', MARGIN, y);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...STONE_500);
  doc.text('\u2014 Spending Report', MARGIN + 30, y);
  y += 10;

  // Date range
  const rangeText = `${formatReportDate(data.stats.dateRange.start)} \u2013 ${formatReportDate(data.stats.dateRange.end)}`;
  doc.setFontSize(10);
  doc.setTextColor(...STONE_500);
  doc.text(rangeText, MARGIN, y);
  y += 12;

  // Divider
  doc.setDrawColor(...STONE_200);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, MARGIN + CONTENT_WIDTH, y);
  y += 10;

  // Summary stats
  y = drawSectionHeader(doc, 'Summary', y);

  const expenseColor: readonly [number, number, number] = [184, 85, 69];
  const incomeColor: readonly [number, number, number] = [61, 138, 108];

  const summaryItems: { label: string; value: string; color: readonly [number, number, number] }[] = [
    { label: 'Total Spent', value: formatCurrency(data.stats.totalSpent), color: expenseColor },
    { label: 'Total Income', value: formatCurrency(data.stats.totalIncome), color: incomeColor },
    { label: 'Net', value: formatCurrency(data.stats.net), color: data.stats.net >= 0 ? incomeColor : expenseColor },
    { label: 'Transactions', value: String(data.stats.transactionCount), color: STONE_900 },
  ];

  const cardWidth = (CONTENT_WIDTH - 12) / 4;
  for (let i = 0; i < summaryItems.length; i++) {
    const item = summaryItems[i];
    const x = MARGIN + i * (cardWidth + 4);

    doc.setFillColor(245, 245, 244); // stone-100
    doc.roundedRect(x, y, cardWidth, 22, 2, 2, 'F');

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...STONE_500);
    doc.text(item.label.toUpperCase(), x + 4, y + 7);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...item.color);
    doc.text(item.value, x + 4, y + 16);
  }
  y += 32;

  // Category Breakdown
  y = drawSectionHeader(doc, 'Category Breakdown', y);

  const catColumns = [
    { label: '', x: MARGIN, width: 4 },
    { label: 'CATEGORY', x: MARGIN + 6, width: 50 },
    { label: 'AMOUNT', x: MARGIN + 90, width: 40, align: 'right' as const },
    { label: '%', x: MARGIN + 140, width: 25, align: 'right' as const },
  ];
  y = drawTableHeader(doc, catColumns, y);

  for (const row of data.categoryBreakdown) {
    y = ensurePageSpace(doc, y, 8);

    const rgb = hexToRgb(CATEGORY_CONFIG[row.category as Category].color);
    doc.setFillColor(...rgb);
    doc.circle(MARGIN + 2, y - 1, 1.5, 'F');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...STONE_900);
    doc.text(row.category, MARGIN + 6, y);

    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(row.total), MARGIN + 130, y, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...STONE_500);
    doc.text(`${row.percentage.toFixed(1)}%`, MARGIN + 165, y, { align: 'right' });

    y += 7;
  }
  y += 8;

  // Top Merchants
  y = drawSectionHeader(doc, 'Top Merchants', y);

  const merchantColumns = [
    { label: '#', x: MARGIN, width: 8 },
    { label: 'MERCHANT', x: MARGIN + 10, width: 80 },
    { label: 'TOTAL', x: MARGIN + 110, width: 35, align: 'right' as const },
    { label: 'COUNT', x: MARGIN + 155, width: 15, align: 'right' as const },
  ];
  y = drawTableHeader(doc, merchantColumns, y);

  const merchants = data.topMerchants.slice(0, 10);
  for (let i = 0; i < merchants.length; i++) {
    y = ensurePageSpace(doc, y, 8);
    const m = merchants[i];

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...STONE_500);
    doc.text(String(i + 1), MARGIN + 2, y);

    doc.setTextColor(...STONE_900);
    const merchantName =
      m.merchant.length > 40 ? m.merchant.slice(0, 37) + '...' : m.merchant;
    doc.text(merchantName, MARGIN + 10, y);

    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(m.total), MARGIN + 145, y, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...STONE_500);
    doc.text(String(m.count), MARGIN + 170, y, { align: 'right' });

    y += 7;
  }

  // Footer
  y = ensurePageSpace(doc, y + 10, 15);
  doc.setDrawColor(...STONE_200);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, MARGIN + CONTENT_WIDTH, y);
  y += 6;

  const today = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...STONE_500);
  doc.text(`Generated by FinSort on ${today}`, MARGIN, y);

  // Save
  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`finsort-report-${dateStr}.pdf`);
}
