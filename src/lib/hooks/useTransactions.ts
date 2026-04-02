'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabase/client';
import type { Transaction, Category, CategoryWithTransactions } from '../types';

export function useTransactions(userId: string | undefined, month: string | null) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);

    const [catRes, txnRes] = await Promise.all([
      supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId)
        .order('sort_order'),
      month
        ? supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .eq('month', month)
            .order('transaction_date')
        : supabase
            .from('transactions')
            .select('*')
            .eq('user_id', userId)
            .order('transaction_date'),
    ]);

    if (catRes.data) setCategories(catRes.data);
    if (txnRes.data) setTransactions(txnRes.data);
    setLoading(false);
  }, [userId, month]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const categoriesWithTransactions: CategoryWithTransactions[] = categories.map(cat => {
    const catTxns = transactions.filter(t => t.category_id === cat.id);
    const total = catTxns.reduce((sum, t) => sum + Number(t.amount), 0);
    return { ...cat, transactions: catTxns, total };
  });

  const addTransaction = async (data: Omit<Transaction, 'id' | 'created_at'>) => {
    const { error } = await supabase.from('transactions').insert(data);
    if (!error) await fetchData();
    return { error };
  };

  const updateTransaction = async (id: string, data: Partial<Transaction>) => {
    const { error } = await supabase.from('transactions').update(data).eq('id', id);
    if (!error) await fetchData();
    return { error };
  };

  const deleteTransaction = async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (!error) await fetchData();
    return { error };
  };

  return {
    categories,
    transactions,
    categoriesWithTransactions,
    loading,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refresh: fetchData,
  };
}

export function useAvailableMonths(userId: string | undefined) {
  const [months, setMonths] = useState<string[]>([]);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from('transactions')
      .select('month')
      .eq('user_id', userId)
      .order('month', { ascending: false })
      .then(({ data }) => {
        if (data) {
          const unique = [...new Set(data.map(d => d.month))];
          setMonths(unique);
        }
      });
  }, [userId]);

  return months;
}
