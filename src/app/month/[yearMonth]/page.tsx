'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '../../AppShell';
import { useAuth } from '@/lib/hooks/useAuth';
import { useTransactions } from '@/lib/hooks/useTransactions';
import { MonthPicker } from '@/components/layout/MonthPicker';
import { TransactionTable } from '@/components/transactions/TransactionTable';
import { FunMoneyCard } from '@/components/dashboard/FunMoneyCard';
import { NewMonthRollover } from '@/components/transactions/NewMonthRollover';
import { RebuildMonth } from '@/components/transactions/RebuildMonth';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function MonthlyContent({ yearMonth }: { yearMonth: string }) {
  const router = useRouter();
  const { user } = useAuth();

  // Parse yearMonth param (e.g., "2026-01")
  const parts = yearMonth.split('-');
  const year = parseInt(parts[0]) || new Date().getFullYear();
  const month = parseInt(parts[1]) || (new Date().getMonth() + 1);
  const monthKey = `${year}-${String(month).padStart(2, '0')}-01`;

  const {
    categoriesWithTransactions,
    loading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refresh,
  } = useTransactions(user?.id, monthKey);

  const handleMonthChange = (y: number, m: number) => {
    router.push(`/month/${y}-${String(m).padStart(2, '0')}`);
  };

  if (loading || !user) {
    return <div className="text-zinc-500 text-sm p-8">Loading...</div>;
  }

  const totalIncome = categoriesWithTransactions
    .filter(c => c.is_income)
    .reduce((sum, c) => sum + c.total, 0);

  const totalExpenses = categoriesWithTransactions
    .filter(c => !c.is_income && !['Available Fun Money', "Joel's Fun Spending", 'Leftover Fun Money', 'Buffer Amount'].includes(c.name))
    .reduce((sum, c) => sum + c.total, 0);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-lg font-bold text-white">Monthly View</h2>
        <MonthPicker year={year} month={month} onChange={handleMonthChange} />
      </div>

      {/* Summary bar */}
      <div className="flex items-center gap-6 bg-zinc-900 rounded-lg p-4 border border-zinc-800">
        <div>
          <div className="text-xs text-zinc-500">Income</div>
          <div className="text-sm font-bold text-emerald-400">{formatCurrency(totalIncome)}</div>
        </div>
        <div>
          <div className="text-xs text-zinc-500">Expenses</div>
          <div className="text-sm font-bold text-red-400">{formatCurrency(Math.abs(totalExpenses))}</div>
        </div>
        <div>
          <div className="text-xs text-zinc-500">Net</div>
          <div className={`text-sm font-bold ${totalIncome + totalExpenses >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatCurrency(totalIncome + totalExpenses)}
          </div>
        </div>
      </div>

      {/* Fun Money Summary - auto-calculated */}
      <FunMoneyCard categories={categoriesWithTransactions} />

      {/* Transaction categories - hide auto-calculated ones */}
      {categoriesWithTransactions.length === 0 ? (
        <div className="text-center py-12 text-zinc-500">
          <p className="text-sm">No data for this month.</p>
          <p className="text-xs mt-1">Import a CSV or add transactions manually.</p>
        </div>
      ) : (
        <TransactionTable
          categories={categoriesWithTransactions.filter(
            c => !['Available Fun Money', 'Leftover Fun Money'].includes(c.name)
          )}
          month={monthKey}
          userId={user.id}
          onAdd={addTransaction}
          onUpdate={updateTransaction}
          onDelete={deleteTransaction}
        />
      )}

      {/* Rollover to next month */}
      {categoriesWithTransactions.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          <NewMonthRollover
            userId={user.id}
            currentYear={year}
            currentMonth={month}
            categories={categoriesWithTransactions}
            onComplete={refresh}
          />
          <RebuildMonth
            sourceYear={month === 1 ? year - 1 : year}
            sourceMonth={month === 1 ? 12 : month - 1}
            targetYear={year}
            targetMonth={month}
            onComplete={refresh}
          />
        </div>
      )}
    </div>
  );
}

export default function MonthPage({ params }: { params: Promise<{ yearMonth: string }> }) {
  const { yearMonth } = use(params);
  return (
    <AppShell>
      <MonthlyContent yearMonth={yearMonth} />
    </AppShell>
  );
}
