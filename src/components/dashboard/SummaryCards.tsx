'use client';

import { Card, CardContent } from '@/components/ui/card';
import {
  DollarSign,
  CreditCard,
  PiggyBank,
  TrendingDown,
  Fuel,
  ShoppingCart,
  UtensilsCrossed,
} from 'lucide-react';
import type { CategoryWithTransactions } from '@/lib/types';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

interface SummaryCardsProps {
  categories: CategoryWithTransactions[];
}

function getCategoryTotal(categories: CategoryWithTransactions[], name: string): number {
  return categories.find(c => c.name === name)?.total ?? 0;
}

export function SummaryCards({ categories }: SummaryCardsProps) {
  const income = getCategoryTotal(categories, 'Income');
  const bills = getCategoryTotal(categories, 'Bills');
  const gas = getCategoryTotal(categories, 'Gas');
  const groceries = getCategoryTotal(categories, 'Groceries');
  const restaurants = getCategoryTotal(categories, 'Restaurants');
  const savings = getCategoryTotal(categories, 'Savings');
  const vanguard = getCategoryTotal(categories, 'Vanguard');

  const totalExpenses = [bills, gas, groceries, restaurants].reduce(
    (sum, val) => sum + Math.abs(val), 0,
  );

  const cards = [
    { label: 'Income', value: income, icon: DollarSign, color: 'text-emerald-600 dark:text-emerald-400' },
    { label: 'Bills', value: bills, icon: CreditCard, color: 'text-red-600 dark:text-red-400' },
    { label: 'Groceries', value: groceries, icon: ShoppingCart, color: 'text-amber-600 dark:text-amber-400' },
    { label: 'Restaurants', value: restaurants, icon: UtensilsCrossed, color: 'text-orange-600 dark:text-orange-400' },
    { label: 'Gas', value: gas, icon: Fuel, color: 'text-cyan-600 dark:text-cyan-400' },
    { label: 'Savings', value: savings, icon: PiggyBank, color: 'text-blue-600 dark:text-blue-400' },
    { label: 'Retirement', value: vanguard, icon: TrendingDown, color: 'text-purple-600 dark:text-purple-400' },
    { label: 'Total Spent', value: -totalExpenses, icon: CreditCard, color: 'text-red-600 dark:text-red-400' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map(card => (
        <Card key={card.label} className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-zinc-500">{card.label}</span>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </div>
            <div className={`text-lg font-bold ${card.color}`}>
              {formatCurrency(Math.abs(card.value))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
