'use client';

import { useState, useCallback } from 'react';
import { Upload, FileText, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { parseBudgetCsv, getMonthKey } from '@/lib/csv/parser';
import { supabase } from '@/lib/supabase/client';
import type { ParsedMonth, Category } from '@/lib/types';
import { DEFAULT_CATEGORIES } from '@/lib/types';

interface CsvImporterProps {
  userId: string;
  onComplete: () => void;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function CsvImporter({ userId, onComplete }: CsvImporterProps) {
  const [parsedData, setParsedData] = useState<ParsedMonth[] | null>(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setSuccess(false);

    const text = await file.text();
    try {
      const months = parseBudgetCsv(text);
      if (months.length === 0) {
        setError('No monthly data found in the CSV file. Make sure it matches the expected format.');
        return;
      }
      setParsedData(months);
    } catch (err) {
      setError(`Failed to parse CSV: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, []);

  const handleImport = async () => {
    if (!parsedData || !userId) return;
    setImporting(true);
    setError(null);

    try {
      // Ensure categories exist
      const { data: existingCats } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId);

      let categoryMap: Record<string, string> = {};

      if (!existingCats || existingCats.length === 0) {
        // Create default categories
        const inserts = DEFAULT_CATEGORIES.map((cat, idx) => ({
          user_id: userId,
          name: cat.name,
          sort_order: idx,
          is_income: cat.is_income,
        }));
        const { data: newCats, error: catErr } = await supabase
          .from('categories')
          .insert(inserts)
          .select();
        if (catErr) throw catErr;
        newCats?.forEach((c: Category) => { categoryMap[c.name] = c.id; });
      } else {
        existingCats.forEach((c: Category) => { categoryMap[c.name] = c.id; });
      }

      // Import transactions for each month
      for (const month of parsedData) {
        const monthKey = getMonthKey(month.year, month.month);

        // Delete existing transactions for this month first
        await supabase
          .from('transactions')
          .delete()
          .eq('user_id', userId)
          .eq('month', monthKey);

        // Build transaction inserts
        const txnInserts = month.categories.flatMap(cat => {
          const categoryId = categoryMap[cat.name];
          if (!categoryId) return [];
          return cat.transactions.map(txn => ({
            user_id: userId,
            category_id: categoryId,
            month: monthKey,
            name: txn.name,
            transaction_date: txn.date,
            amount: txn.amount,
            is_recurring: false,
          }));
        });

        if (txnInserts.length > 0) {
          const { error: txnErr } = await supabase
            .from('transactions')
            .insert(txnInserts);
          if (txnErr) throw txnErr;
        }

        // Update category notes if present
        for (const cat of month.categories) {
          if (cat.notes && categoryMap[cat.name]) {
            await supabase
              .from('categories')
              .update({ notes: cat.notes })
              .eq('id', categoryMap[cat.name]);
          }
        }
      }

      setSuccess(true);
      setParsedData(null);
      onComplete();
    } catch (err) {
      setError(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Import CSV
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!parsedData && !success && (
          <div className="space-y-4">
            <p className="text-xs text-zinc-500">
              Upload your budget spreadsheet CSV to import historical data.
            </p>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-700 rounded-lg cursor-pointer hover:border-zinc-600 transition-colors">
              <FileText className="w-8 h-8 text-zinc-600 mb-2" />
              <span className="text-sm text-zinc-400">Click to select CSV file</span>
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileSelect}
              />
            </label>
          </div>
        )}

        {parsedData && (
          <div className="space-y-4">
            <div className="text-sm text-zinc-300 font-medium">
              Preview: {parsedData.length} month(s) found
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {parsedData.map(month => (
                <div key={`${month.year}-${month.month}`} className="bg-zinc-800 rounded-lg p-3">
                  <div className="text-sm font-medium text-white mb-2">
                    {month.label} {month.year}
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {month.categories.map(cat => (
                      <div key={cat.name} className="flex justify-between text-xs">
                        <span className="text-zinc-400">{cat.name}</span>
                        <span className={cat.total >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                          {formatCurrency(cat.total)} ({cat.transactions.length})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button onClick={handleImport} disabled={importing} className="flex-1">
                {importing ? 'Importing...' : 'Import Data'}
              </Button>
              <Button variant="outline" onClick={() => setParsedData(null)} className="border-zinc-700">
                Cancel
              </Button>
            </div>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 text-emerald-400 text-sm">
            <Check className="w-4 h-4" />
            Import complete!
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 text-red-400 text-xs mt-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
