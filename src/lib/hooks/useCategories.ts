'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../supabase/client';
import type { Category } from '../types';
import { DEFAULT_CATEGORIES } from '../types';

export function useCategories(userId: string | undefined) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order');
    if (data) setCategories(data);
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const initializeDefaultCategories = async () => {
    if (!userId) return;
    const inserts = DEFAULT_CATEGORIES.map((cat, idx) => ({
      user_id: userId,
      name: cat.name,
      sort_order: idx,
      is_income: cat.is_income,
    }));
    const { error } = await supabase.from('categories').insert(inserts);
    if (!error) await fetchCategories();
    return { error };
  };

  const updateCategory = async (id: string, data: Partial<Category>) => {
    const { error } = await supabase.from('categories').update(data).eq('id', id);
    if (!error) await fetchCategories();
    return { error };
  };

  return { categories, loading, fetchCategories, initializeDefaultCategories, updateCategory };
}
