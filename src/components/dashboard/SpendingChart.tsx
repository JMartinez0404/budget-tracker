'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CategoryWithTransactions } from '@/lib/types';

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#14b8a6',
];

// Categories to show in the spending breakdown (exclude income, fun money meta-categories)
const SPENDING_CATEGORIES = [
  'Bills', 'Gas', 'Groceries', 'Restaurants', 'Other',
  'Vanguard', 'Unexpected Expenses', 'Savings',
];

interface SpendingChartProps {
  categories: CategoryWithTransactions[];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function SpendingDonutChart({ categories }: SpendingChartProps) {
  const data = categories
    .filter(c => SPENDING_CATEGORIES.includes(c.name) && c.total !== 0)
    .map(c => ({
      name: c.name,
      value: Math.abs(c.total),
    }))
    .sort((a, b) => b.value - a.value);

  if (data.length === 0) {
    return (
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-zinc-400">Spending Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center text-zinc-500 text-sm">
            No spending data yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-zinc-400">Spending Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((_, idx) => (
                <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: '#18181b',
                border: '1px solid #3f3f46',
                borderRadius: '8px',
                color: '#fff',
              }}
              formatter={(value) => formatCurrency(Number(value))}
            />
            <Legend
              iconSize={8}
              wrapperStyle={{ color: '#a1a1aa', fontSize: '12px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function CategoryBarChart({ categories }: SpendingChartProps) {
  const data = categories
    .filter(c => SPENDING_CATEGORIES.includes(c.name) && c.total !== 0)
    .map((c, idx) => ({
      name: c.name,
      amount: Math.abs(c.total),
      color: COLORS[idx % COLORS.length],
    }))
    .sort((a, b) => b.amount - a.amount);

  const maxAmount = Math.max(...data.map(d => d.amount), 1);

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-zinc-400">Category Totals</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map(item => (
            <div key={item.name}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-zinc-400">{item.name}</span>
                <span className="text-xs font-medium text-white">{formatCurrency(item.amount)}</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${(item.amount / maxAmount) * 100}%`,
                    backgroundColor: item.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
