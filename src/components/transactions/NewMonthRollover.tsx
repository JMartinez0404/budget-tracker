'use client';

import { useState } from 'react';
import { Copy, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase/client';
import type { CategoryWithTransactions } from '@/lib/types';

// Categories that get rolled over to the next month
const ROLLOVER_CATEGORIES = ['Income', 'Bills', 'Vanguard', 'Savings', 'Buffer Amount'];

// Categories used to compute Available Fun Money (everything before the fun section)
const PRE_FUN_CATEGORIES = [
  'Income', 'Bills', 'Gas', 'Groceries', 'Restaurants',
  'Other', 'Vanguard', 'Unexpected Expenses', 'Savings', 'Buffer Amount',
];

interface NewMonthRolloverProps {
  userId: string;
  currentYear: number;
  currentMonth: number; // 1-12
  categories: CategoryWithTransactions[];
  onComplete: () => void;
}

function getNextMonth(year: number, month: number): { year: number; month: number } {
  if (month === 12) return { year: year + 1, month: 1 };
  return { year, month: month + 1 };
}

function updateDateToMonth(dateStr: string, targetYear: number, targetMonth: number): string {
  const parts = dateStr.split('-');
  const day = parseInt(parts[2] || '1', 10);
  // Clamp day to max days in target month
  const maxDay = new Date(targetYear, targetMonth, 0).getDate();
  const clampedDay = Math.min(day, maxDay);
  return `${targetYear}-${String(targetMonth).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`;
}

export function NewMonthRollover({
  userId,
  currentYear,
  currentMonth,
  categories,
  onComplete,
}: NewMonthRolloverProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const next = getNextMonth(currentYear, currentMonth);
  const nextMonthKey = `${next.year}-${String(next.month).padStart(2, '0')}-01`;

  const monthNames = [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  // Count what will be copied
  const rolloverCats = categories.filter(c => ROLLOVER_CATEGORIES.includes(c.name));
  const totalTxns = rolloverCats.reduce((sum, c) => sum + c.transactions.length, 0);

  const handleRollover = async () => {
    setLoading(true);
    setError(null);

    try {
      // Check if next month already has data
      const { data: existing } = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', userId)
        .eq('month', nextMonthKey)
        .limit(1);

      if (existing && existing.length > 0) {
        setError(`${monthNames[next.month]} ${next.year} already has transactions. Delete them first or add manually.`);
        setLoading(false);
        return;
      }

      const inserts: Array<{
        user_id: string;
        category_id: string;
        month: string;
        name: string;
        transaction_date: string;
        amount: number;
        is_recurring: boolean;
      }> = [];

      // Get the buffer amount total from current month to carry over as income
      const bufferCat = categories.find(c => c.name === 'Buffer Amount');
      const bufferTotal = bufferCat ? Math.abs(bufferCat.total) : 0;
      const incomeCat = categories.find(c => c.name === 'Income');

      // Add buffer carryover as an Income transaction in the next month
      if (bufferTotal > 0 && incomeCat) {
        inserts.push({
          user_id: userId,
          category_id: incomeCat.id,
          month: nextMonthKey,
          name: 'Buffer amount',
          transaction_date: `${next.year}-${String(next.month).padStart(2, '0')}-01`,
          amount: bufferTotal,
          is_recurring: true,
        });
      }

      // Carry over leftover fun money to next month's Fun Spending
      // Available Fun Money = net of all pre-fun categories
      const availableFun = categories
        .filter(c => PRE_FUN_CATEGORIES.includes(c.name))
        .reduce((sum, c) => sum + c.total, 0);
      const funSpentCat = categories.find(c => c.name === "Joel's Fun Spending");
      const funSpentTotal = Math.abs(funSpentCat?.total ?? 0);
      const leftoverFun = availableFun - funSpentTotal;

      if (funSpentCat && leftoverFun !== 0) {
        inserts.push({
          user_id: userId,
          category_id: funSpentCat.id,
          month: nextMonthKey,
          name: "Joel's Fun Money debt from last month",
          transaction_date: `${next.year}-${String(next.month).padStart(2, '0')}-01`,
          amount: leftoverFun, // positive = surplus, negative = debt
          is_recurring: false,
        });
      }

      for (const cat of rolloverCats) {
        if (cat.name === 'Savings' && cat.transactions.length === 0) {
          // If no savings transactions exist, create defaults
          const savingsEntries = [
            { name: 'Barclays Main Savings', amount: -700 },
            { name: 'Barclays Vacation Savings', amount: -200 },
            { name: 'Vanguard Emergency Savings', amount: -200 },
            { name: 'Tattoo Savings', amount: -400 },
          ];
          for (const entry of savingsEntries) {
            inserts.push({
              user_id: userId,
              category_id: cat.id,
              month: nextMonthKey,
              name: entry.name,
              transaction_date: `${next.year}-${String(next.month).padStart(2, '0')}-27`,
              amount: entry.amount,
              is_recurring: true,
            });
          }
        } else {
          // Copy existing transactions with updated dates
          for (const txn of cat.transactions) {
            inserts.push({
              user_id: userId,
              category_id: cat.id,
              month: nextMonthKey,
              name: txn.name,
              transaction_date: updateDateToMonth(txn.transaction_date, next.year, next.month),
              amount: Number(txn.amount),
              is_recurring: true,
            });
          }
        }
      }

      if (inserts.length > 0) {
        const { error: insertErr } = await supabase
          .from('transactions')
          .insert(inserts);
        if (insertErr) throw insertErr;
      }

      setSuccess(true);
      onComplete();
    } catch (err) {
      setError(`Rollover failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm">
            <Check className="w-4 h-4" />
            {monthNames[next.month]} {next.year} created! Navigate to it to review and edit.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
          <Copy className="w-4 h-4" />
          Start Next Month
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-zinc-500 mb-3">
          Copy recurring items to <span className="text-zinc-900 dark:text-white font-medium">{monthNames[next.month]} {next.year}</span> with updated dates.
          You can edit everything after.
        </p>

        <div className="space-y-1 mb-4">
          {rolloverCats.map(cat => (
            <div key={cat.id} className="flex items-center justify-between text-xs">
              <span className="text-zinc-600 dark:text-zinc-400">{cat.name}</span>
              <span className="text-zinc-500">
                {cat.transactions.length} item{cat.transactions.length !== 1 ? 's' : ''}
                {cat.name === 'Savings' && cat.transactions.length === 0 && ' (defaults ~$1,500)'}
              </span>
            </div>
          ))}
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-1 mt-2 flex items-center justify-between text-xs">
            <span className="text-zinc-700 dark:text-zinc-300 font-medium">Total</span>
            <span className="text-zinc-700 dark:text-zinc-300">{totalTxns} transactions</span>
          </div>
        </div>

        <Button onClick={handleRollover} disabled={loading} className="w-full" variant="outline">
          <Copy className="w-4 h-4 mr-2" />
          {loading ? 'Creating...' : `Create ${monthNames[next.month]} ${next.year}`}
        </Button>

        {error && (
          <div className="flex items-start gap-2 text-red-600 dark:text-red-400 text-xs mt-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
