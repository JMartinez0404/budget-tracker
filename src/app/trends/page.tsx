'use client';

import { AppShell } from '../AppShell';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTransactions } from '@/lib/hooks/useTransactions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Legend,
} from 'recharts';

const MONTH_LABELS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const CATEGORY_COLORS: Record<string, string> = {
  Bills: '#ef4444',
  Gas: '#06b6d4',
  Groceries: '#eab308',
  Restaurants: '#f97316',
  Other: '#8b5cf6',
  Vanguard: '#3b82f6',
  Savings: '#22c55e',
};

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function TrendsContent() {
  const { user } = useAuth();

  // Fetch all transactions (no month filter)
  const { categoriesWithTransactions, transactions, loading } = useTransactions(user?.id, null);

  if (loading) {
    return <div className="text-zinc-500 text-sm p-8">Loading trends...</div>;
  }

  // Group transactions by month
  const monthMap = new Map<string, Map<string, number>>();
  const incomeByMonth = new Map<string, number>();
  const expenseByMonth = new Map<string, number>();

  for (const txn of transactions) {
    const monthKey = txn.month;
    if (!monthMap.has(monthKey)) monthMap.set(monthKey, new Map());

    const cat = categoriesWithTransactions.find(c => c.id === txn.category_id);
    if (!cat) continue;

    const catMap = monthMap.get(monthKey)!;
    catMap.set(cat.name, (catMap.get(cat.name) || 0) + Math.abs(Number(txn.amount)));

    if (cat.is_income) {
      incomeByMonth.set(monthKey, (incomeByMonth.get(monthKey) || 0) + Number(txn.amount));
    } else if (['Bills', 'Gas', 'Groceries', 'Restaurants', 'Other'].includes(cat.name)) {
      expenseByMonth.set(monthKey, (expenseByMonth.get(monthKey) || 0) + Math.abs(Number(txn.amount)));
    }
  }

  const sortedMonths = [...monthMap.keys()].sort();

  // Income vs Expenses data
  const incomeVsExpenses = sortedMonths.map(m => {
    const parts = m.split('-');
    return {
      month: `${MONTH_LABELS[parseInt(parts[1])]} ${parts[0]}`,
      Income: incomeByMonth.get(m) || 0,
      Expenses: expenseByMonth.get(m) || 0,
    };
  });

  // Category breakdown per month for bar chart
  const spendingCategories = ['Bills', 'Gas', 'Groceries', 'Restaurants', 'Other', 'Savings', 'Vanguard'];
  const categoryData = sortedMonths.map(m => {
    const parts = m.split('-');
    const entry: Record<string, string | number> = {
      month: `${MONTH_LABELS[parseInt(parts[1])]} ${parts[0]}`,
    };
    const catMap = monthMap.get(m)!;
    for (const cat of spendingCategories) {
      entry[cat] = catMap.get(cat) || 0;
    }
    return entry;
  });

  if (sortedMonths.length === 0) {
    return (
      <div className="space-y-6 max-w-6xl">
        <h2 className="text-lg font-bold text-white">Trends</h2>
        <div className="text-center py-12 text-zinc-500">
          <p className="text-sm">No data yet.</p>
          <p className="text-xs mt-1">Import your CSV to see spending trends.</p>
        </div>
      </div>
    );
  }

  const tooltipStyle = {
    contentStyle: {
      background: '#18181b',
      border: '1px solid #3f3f46',
      borderRadius: '8px',
      color: '#fff',
      fontSize: '12px',
    },
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <h2 className="text-lg font-bold text-white">Trends</h2>

      {/* Income vs Expenses */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-zinc-400">Income vs Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={incomeVsExpenses}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="month" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
              <YAxis tick={{ fill: '#a1a1aa', fontSize: 12 }} tickFormatter={v => `$${v}`} />
              <Tooltip {...tooltipStyle} formatter={(value) => formatCurrency(Number(value))} />
              <Legend wrapperStyle={{ color: '#a1a1aa', fontSize: '12px' }} />
              <Line type="monotone" dataKey="Income" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="Expenses" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-zinc-400">Spending by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="month" tick={{ fill: '#a1a1aa', fontSize: 12 }} />
              <YAxis tick={{ fill: '#a1a1aa', fontSize: 12 }} tickFormatter={v => `$${v}`} />
              <Tooltip {...tooltipStyle} formatter={(value) => formatCurrency(Number(value))} />
              <Legend wrapperStyle={{ color: '#a1a1aa', fontSize: '12px' }} />
              {spendingCategories.map(cat => (
                <Bar key={cat} dataKey={cat} fill={CATEGORY_COLORS[cat] || '#6b7280'} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

export default function TrendsPage() {
  return (
    <AppShell>
      <TrendsContent />
    </AppShell>
  );
}
