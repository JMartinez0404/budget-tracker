'use client';

import { useState } from 'react';
import { AppShell } from './AppShell';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTransactions, useAvailableMonths } from '@/lib/hooks/useTransactions';
import { MonthPicker } from '@/components/layout/MonthPicker';
import { FunMoneyCard } from '@/components/dashboard/FunMoneyCard';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { SpendingDonutChart, CategoryBarChart } from '@/components/dashboard/SpendingChart';

function DashboardContent() {
  const { user } = useAuth();
  const availableMonths = useAvailableMonths(user?.id);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const monthKey = `${year}-${String(month).padStart(2, '0')}-01`;
  const { categoriesWithTransactions, loading } = useTransactions(user?.id, monthKey);

  const handleMonthChange = (y: number, m: number) => {
    setYear(y);
    setMonth(m);
  };

  if (loading) {
    return <div className="text-zinc-500 text-sm p-8">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Dashboard</h2>
        <MonthPicker year={year} month={month} onChange={handleMonthChange} />
      </div>

      {availableMonths.length > 0 && (
        <div className="text-xs text-zinc-500 dark:text-zinc-600">
          Data available for: {availableMonths.map(m => {
            const parts = m.split('-');
            const mo = parseInt(parts[1]);
            return `${['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][mo]} ${parts[0]}`;
          }).join(', ')}
        </div>
      )}

      <FunMoneyCard categories={categoriesWithTransactions} />
      <SummaryCards categories={categoriesWithTransactions} />

      <div className="grid md:grid-cols-2 gap-4">
        <SpendingDonutChart categories={categoriesWithTransactions} />
        <CategoryBarChart categories={categoriesWithTransactions} />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <AppShell>
      <DashboardContent />
    </AppShell>
  );
}
