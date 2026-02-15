import type { MerchantSummary } from '@/types/chart';
import { formatCurrency } from '@/utils/format';

interface TopMerchantsProps {
  data: MerchantSummary[];
}

export function TopMerchants({ data }: TopMerchantsProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h2 className="text-lg font-semibold mb-4">Top Merchants</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b">
            <th className="pb-2">Merchant</th>
            <th className="pb-2 text-right">Transactions</th>
            <th className="pb-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {data.map(({ merchant, count, total }) => (
            <tr key={merchant} className="border-b last:border-0">
              <td className="py-2">{merchant}</td>
              <td className="py-2 text-right">{count}</td>
              <td className="py-2 text-right">{formatCurrency(total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
