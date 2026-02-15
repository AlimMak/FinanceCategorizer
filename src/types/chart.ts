export interface ChartDataPoint {
  category: string;
  total: number;
  count: number;
  percentage: number;
}

export interface TimelineEntry {
  period: string;
  total: number;
}

export interface MerchantSummary {
  merchant: string;
  total: number;
  count: number;
}
