'use client';

import { useState } from 'react';
import { Trash2, Pencil, Plus, Check, X, ChevronDown, ChevronRight, Star, LayoutList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { CategoryWithTransactions, Transaction } from '@/lib/types';
import { useFavorites } from '@/lib/hooks/useFavorites';
import { BulkAddModal } from './BulkAddModal';

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

interface TransactionTableProps {
  categories: CategoryWithTransactions[];
  month: string;
  userId: string;
  onAdd: (data: Omit<Transaction, 'id' | 'created_at'>) => Promise<{ error: unknown }>;
  onBulkAdd: (data: Omit<Transaction, 'id' | 'created_at'>[]) => Promise<{ error: unknown }>;
  onUpdate: (id: string, data: Partial<Transaction>) => Promise<{ error: unknown }>;
  onDelete: (id: string) => Promise<{ error: unknown }>;
}

interface EditingState {
  id: string | null;
  name: string;
  date: string;
  amount: string;
}

interface AddingState {
  categoryId: string | null;
  name: string;
  date: string;
  amount: string;
}

export function TransactionTable({
  categories,
  month,
  userId,
  onAdd,
  onBulkAdd,
  onUpdate,
  onDelete,
}: TransactionTableProps) {
  const today = new Date().toISOString().slice(0, 10);

  const [editing, setEditing] = useState<EditingState>({
    id: null, name: '', date: '', amount: '',
  });
  const [adding, setAdding] = useState<AddingState>({
    categoryId: null, name: '', date: '', amount: '',
  });
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [showBulkAdd, setShowBulkAdd] = useState(false);

  const { favorites, addFavorite, removeFavorite, isFavorite, findFavorite } = useFavorites(userId);

  const toggleCollapse = (id: string) => {
    setCollapsed(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const startEdit = (txn: Transaction) => {
    setEditing({
      id: txn.id,
      name: txn.name,
      date: txn.transaction_date,
      amount: String(txn.amount),
    });
  };

  const cancelEdit = () => {
    setEditing({ id: null, name: '', date: '', amount: '' });
  };

  const saveEdit = async () => {
    if (!editing.id) return;
    await onUpdate(editing.id, {
      name: editing.name,
      transaction_date: editing.date,
      amount: parseFloat(editing.amount),
    });
    cancelEdit();
  };

  const startAdd = (categoryId: string) => {
    setAdding({ categoryId, name: '', date: today, amount: '' });
  };

  const cancelAdd = () => {
    setAdding({ categoryId: null, name: '', date: '', amount: '' });
  };

  const saveAdd = async () => {
    if (!adding.categoryId || !adding.name || !adding.amount) return;
    await onAdd({
      user_id: userId,
      category_id: adding.categoryId,
      month,
      name: adding.name,
      transaction_date: adding.date,
      amount: parseFloat(adding.amount),
      is_recurring: false,
      recurring_template_id: null,
    });
    cancelAdd();
  };

  const toggleFavorite = (txn: Transaction) => {
    const fav = findFavorite(txn.name, txn.category_id);
    if (fav) {
      removeFavorite(fav.id);
    } else {
      addFavorite({ name: txn.name, amount: txn.amount, category_id: txn.category_id });
    }
  };

  return (
    <div className="space-y-2">

      <div className="flex justify-end">
        <Button
          variant="ghost"
          onClick={() => setShowBulkAdd(true)}
          className="text-xs h-8 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
        >
          <LayoutList className="w-3 h-3 mr-2" />
          Bulk Add
        </Button>
      </div>

      {categories.map(cat => {
        const isCollapsed = collapsed.has(cat.id);
        const catFavorites = favorites.filter(f => f.category_id === cat.id);
        return (
          <div
            key={cat.id}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden"
          >
            {/* Category header */}
            <button
              onClick={() => toggleCollapse(cat.id)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                {isCollapsed
                  ? <ChevronRight className="w-4 h-4 text-zinc-500" />
                  : <ChevronDown className="w-4 h-4 text-zinc-500" />
                }
                <span className="text-sm font-medium text-zinc-900 dark:text-white">{cat.name}</span>
                <span className="text-xs text-zinc-500">({cat.transactions.length})</span>
              </div>
              <span className={`text-sm font-bold ${cat.is_income ? 'text-emerald-600 dark:text-emerald-400' : cat.total < 0 ? 'text-red-600 dark:text-red-400' : 'text-zinc-700 dark:text-zinc-300'}`}>
                {formatCurrency(cat.total)}
              </span>
            </button>

            {/* Transactions */}
            {!isCollapsed && (
              <div className="px-4 pb-3 space-y-1">
                {cat.transactions.map(txn => (
                  <div key={txn.id} className="group">
                    {editing.id === txn.id ? (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 py-1">
                        <Input
                          value={editing.name}
                          onChange={e => setEditing(s => ({ ...s, name: e.target.value }))}
                          className="h-8 bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white text-xs w-full sm:flex-1"
                          placeholder="Name"
                        />
                        <div className="flex items-center gap-2">
                          <Input
                            type="date"
                            value={editing.date}
                            onChange={e => setEditing(s => ({ ...s, date: e.target.value }))}
                            className="h-8 bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white text-xs flex-1 sm:w-32 sm:flex-none"
                          />
                          <Input
                            type="number"
                            step="0.01"
                            value={editing.amount}
                            onChange={e => setEditing(s => ({ ...s, amount: e.target.value }))}
                            className="h-8 bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white text-xs w-24"
                            placeholder="Amount"
                          />
                          <Button variant="ghost" size="icon" onClick={saveEdit} className="h-8 w-8 text-emerald-600 dark:text-emerald-400">
                            <Check className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={cancelEdit} className="h-8 w-8 text-zinc-600 dark:text-zinc-400">
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800/50">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <span className="text-xs text-zinc-500 w-16 flex-shrink-0">
                            {formatDate(txn.transaction_date)}
                          </span>
                          <span className="text-sm text-zinc-700 dark:text-zinc-300 truncate">{txn.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${txn.amount >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                            {formatCurrency(txn.amount)}
                          </span>
                          <div className="md:opacity-0 md:group-hover:opacity-100 flex gap-1 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleFavorite(txn)}
                              className={`h-6 w-6 ${isFavorite(txn.name, txn.category_id) ? 'text-amber-400' : 'text-zinc-400 hover:text-amber-400'}`}
                              title={isFavorite(txn.name, txn.category_id) ? 'Remove from favorites' : 'Save as favorite'}
                            >
                              <Star className="w-3 h-3" fill={isFavorite(txn.name, txn.category_id) ? 'currentColor' : 'none'} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => startEdit(txn)}
                              className="h-6 w-6 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onDelete(txn.id)}
                              className="h-6 w-6 text-zinc-500 hover:text-red-600 dark:hover:text-red-400"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Favorite chips */}
                {catFavorites.length > 0 && adding.categoryId !== cat.id && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {catFavorites.map(fav => (
                      <button
                        key={fav.id}
                        onClick={() => setAdding({ categoryId: cat.id, name: fav.name, date: today, amount: String(fav.amount) })}
                        className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-900/20 dark:hover:text-amber-400 transition-colors"
                      >
                        <Star className="w-2.5 h-2.5 text-amber-400" fill="currentColor" />
                        {fav.name}
                      </button>
                    ))}
                  </div>
                )}

                {/* Add new transaction */}
                {adding.categoryId === cat.id ? (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 py-1 mt-2">
                    <Input
                      value={adding.name}
                      onChange={e => setAdding(s => ({ ...s, name: e.target.value }))}
                      className="h-8 bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white text-xs w-full sm:flex-1"
                      placeholder="Name"
                      autoFocus
                    />
                    <div className="flex items-center gap-2">
                      <Input
                        type="date"
                        value={adding.date}
                        onChange={e => setAdding(s => ({ ...s, date: e.target.value }))}
                        className="h-8 bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white text-xs flex-1 sm:w-32 sm:flex-none"
                      />
                      <Input
                        type="number"
                        step="0.01"
                        value={adding.amount}
                        onChange={e => setAdding(s => ({ ...s, amount: e.target.value }))}
                        className="h-8 bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white text-xs w-24"
                        placeholder="-50.00"
                      />
                      <Button variant="ghost" size="icon" onClick={saveAdd} className="h-8 w-8 text-emerald-600 dark:text-emerald-400">
                        <Check className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={cancelAdd} className="h-8 w-8 text-zinc-600 dark:text-zinc-400">
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    onClick={() => startAdd(cat.id)}
                    className="w-full justify-start text-zinc-500 hover:text-zinc-900 dark:hover:text-white text-xs mt-1 h-8"
                  >
                    <Plus className="w-3 h-3 mr-2" />
                    Add transaction
                  </Button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {showBulkAdd && (
        <BulkAddModal
          categories={categories}
          month={month}
          userId={userId}
          onSave={onBulkAdd}
          onClose={() => setShowBulkAdd(false)}
        />
      )}
    </div>
  );
}
