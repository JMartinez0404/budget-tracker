'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, X, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase/client';
import type { CategoryWithTransactions, Transaction } from '@/lib/types';

interface BulkRow {
  id: string;
  name: string;
  date: string;
  amount: string;
  category_id: string;
  manuallyPicked: boolean;
}

interface BulkAddModalProps {
  categories: CategoryWithTransactions[];
  month: string;
  userId: string;
  onSave: (data: Omit<Transaction, 'id' | 'created_at'>[]) => Promise<{ error: unknown }>;
  onClose: () => void;
}

function newRow(date: string, categoryId: string): BulkRow {
  return { id: crypto.randomUUID(), name: '', date, amount: '', category_id: categoryId, manuallyPicked: false };
}

export function BulkAddModal({ categories, month, userId, onSave, onClose }: BulkAddModalProps) {
  const today = new Date().toISOString().slice(0, 10);
  const firstCategoryId = categories[0]?.id ?? '';

  const [rows, setRows] = useState<BulkRow[]>([newRow(today, firstCategoryId)]);
  const [saving, setSaving] = useState(false);
  const [nameMap, setNameMap] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    supabase
      .from('transactions')
      .select('name, category_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(500)
      .then(({ data }) => {
        if (!data) return;
        const counts = new Map<string, Map<string, number>>();
        for (const txn of data) {
          const n = txn.name.toLowerCase().trim();
          if (!counts.has(n)) counts.set(n, new Map());
          const m = counts.get(n)!;
          m.set(txn.category_id, (m.get(txn.category_id) ?? 0) + 1);
        }
        const result = new Map<string, string>();
        for (const [name, catMap] of counts) {
          let best = '', bestCount = 0;
          for (const [catId, count] of catMap) {
            if (count > bestCount) { bestCount = count; best = catId; }
          }
          result.set(name, best);
        }
        setNameMap(result);
      });
  }, [userId]);

  const updateRow = (id: string, patch: Partial<BulkRow>) =>
    setRows(prev => prev.map(r => r.id === id ? { ...r, ...patch } : r));

  const handleNameChange = (id: string, name: string) => {
    const suggested = nameMap.get(name.toLowerCase().trim()) ?? null;
    setRows(prev => prev.map(r => {
      if (r.id !== id) return r;
      return {
        ...r,
        name,
        category_id: suggested && !r.manuallyPicked ? suggested : r.category_id,
      };
    }));
  };

  const addRow = () => {
    const last = rows[rows.length - 1];
    setRows(prev => [...prev, newRow(last?.date ?? today, last?.category_id ?? firstCategoryId)]);
  };

  const removeRow = (id: string) => setRows(prev => prev.filter(r => r.id !== id));

  const handleSave = async () => {
    const valid = rows.filter(r => r.name.trim() && r.amount && r.category_id);
    if (!valid.length) return;
    setSaving(true);
    const txns = valid.map(r => ({
      user_id: userId,
      category_id: r.category_id,
      month,
      name: r.name.trim(),
      transaction_date: r.date,
      amount: parseFloat(r.amount),
      is_recurring: false as const,
      recurring_template_id: null,
    }));
    await onSave(txns);
    setSaving(false);
    onClose();
  };

  const validCount = rows.filter(r => r.name.trim() && r.amount && r.category_id).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 w-full max-w-2xl max-h-[90vh] flex flex-col">

        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex-shrink-0">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-white">Bulk Add Transactions</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7">
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-3 space-y-3">
          {rows.map((row, idx) => (
            <div key={row.id} className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400 w-4 flex-shrink-0">{idx + 1}</span>
                <Input
                  placeholder="Name"
                  value={row.name}
                  onChange={e => handleNameChange(row.id, e.target.value)}
                  className="h-8 text-xs bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white flex-1"
                />
              </div>
              <div className="flex items-center gap-2 pl-6">
                <Input
                  type="date"
                  value={row.date}
                  onChange={e => updateRow(row.id, { date: e.target.value })}
                  className="h-8 text-xs bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white flex-1 sm:flex-none sm:w-32"
                />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="-50.00"
                  value={row.amount}
                  onChange={e => updateRow(row.id, { amount: e.target.value })}
                  className="h-8 text-xs bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white w-24 flex-shrink-0"
                />
                <select
                  value={row.category_id}
                  onChange={e => updateRow(row.id, { category_id: e.target.value, manuallyPicked: true })}
                  className="h-8 text-xs rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white px-2 flex-1 min-w-0"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                {rows.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRow(row.id)}
                    className="h-8 w-8 text-zinc-400 hover:text-red-500 flex-shrink-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="px-5 py-4 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 flex-shrink-0">
          <Button variant="ghost" onClick={addRow} className="text-xs h-8 text-zinc-600 dark:text-zinc-400">
            <Plus className="w-3 h-3 mr-1" />
            Add row
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onClose} className="text-xs h-8">Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={saving || validCount === 0}
              className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
            >
              {saving
                ? <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                : <Check className="w-3 h-3 mr-1" />}
              Save {validCount > 0 ? `${validCount} transaction${validCount !== 1 ? 's' : ''}` : 'transactions'}
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}
