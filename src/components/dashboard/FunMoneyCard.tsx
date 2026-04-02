'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CategoryWithTransactions } from '@/lib/types';

interface FunMoneyCardProps {
  categories: CategoryWithTransactions[];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function FunMoneyCard({ categories }: FunMoneyCardProps) {
  const available = categories.find(c => c.name === 'Available Fun Money');
  const spent = categories.find(c => c.name === "Joel's Fun Spending");
  const leftover = categories.find(c => c.name === 'Leftover Fun Money');

  const availableTotal = Math.abs(available?.total ?? 0);
  const spentTotal = Math.abs(spent?.total ?? 0);
  const leftoverTotal = leftover?.total ?? 0;

  const pct = availableTotal > 0 ? Math.min((spentTotal / availableTotal) * 100, 100) : 0;

  // Color coding based on remaining
  const ringColor = leftoverTotal >= 0
    ? pct > 80 ? 'text-amber-500' : 'text-emerald-500'
    : 'text-red-500';
  const bgRingColor = 'text-zinc-800';

  // SVG ring dimensions
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-zinc-400">Fun Money</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          {/* Progress Ring */}
          <div className="relative w-24 h-24 flex-shrink-0">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50" cy="50" r={radius}
                fill="none" strokeWidth="8"
                className={`stroke-current ${bgRingColor}`}
              />
              <circle
                cx="50" cy="50" r={radius}
                fill="none" strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className={`stroke-current ${ringColor} transition-all duration-500`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-bold text-white">{Math.round(pct)}%</span>
            </div>
          </div>

          {/* Numbers */}
          <div className="flex-1 space-y-2">
            <div>
              <div className="text-xs text-zinc-500">Available</div>
              <div className="text-lg font-bold text-white">{formatCurrency(availableTotal)}</div>
            </div>
            <div>
              <div className="text-xs text-zinc-500">Spent</div>
              <div className="text-lg font-bold text-red-400">{formatCurrency(spentTotal)}</div>
            </div>
            <div>
              <div className="text-xs text-zinc-500">Remaining</div>
              <div className={`text-lg font-bold ${leftoverTotal >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {formatCurrency(leftoverTotal)}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
