'use client';

import { AppShell } from '../AppShell';
import { useAuth } from '@/lib/hooks/useAuth';
import { useCategories } from '@/lib/hooks/useCategories';
import { useTransactions } from '@/lib/hooks/useTransactions';
import { CsvImporter } from '@/components/import-export/CsvImporter';
import { CsvExporter } from '@/components/import-export/CsvExporter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';

function SettingsContent() {
  const { user } = useAuth();
  const { categories, fetchCategories } = useCategories(user?.id);

  const now = new Date();
  const [year] = useState(now.getFullYear());
  const [month] = useState(now.getMonth() + 1);
  const monthKey = `${year}-${String(month).padStart(2, '0')}-01`;

  const { categoriesWithTransactions, refresh } = useTransactions(user?.id, monthKey);

  const handleImportComplete = () => {
    fetchCategories();
    refresh();
  };

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Settings</h2>

      {/* Import/Export */}
      <div className="grid md:grid-cols-2 gap-4">
        <CsvImporter userId={user.id} onComplete={handleImportComplete} />
        <CsvExporter year={year} month={month} categories={categoriesWithTransactions} />
      </div>

      {/* Categories */}
      <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Categories</CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-xs text-zinc-500">
              No categories yet. Import a CSV to auto-create them.
            </p>
          ) : (
            <div className="space-y-2">
              {categories.map(cat => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between py-2 px-3 rounded bg-zinc-100 dark:bg-zinc-800/50"
                >
                  <div>
                    <span className="text-sm text-zinc-900 dark:text-white">{cat.name}</span>
                    {cat.notes && (
                      <p className="text-xs text-zinc-500 mt-0.5">{cat.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {cat.is_income && (
                      <span className="text-xs bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded">
                        Income
                      </span>
                    )}
                    {cat.budget_limit && (
                      <span className="text-xs text-zinc-600 dark:text-zinc-400">
                        Limit: ${cat.budget_limit}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <AppShell>
      <SettingsContent />
    </AppShell>
  );
}
