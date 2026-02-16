export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr + 'T00:00:00');
  if (isNaN(date.getTime())) return dateStr;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}
