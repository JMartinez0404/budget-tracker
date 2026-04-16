'use client';

import { useState } from 'react';
import { RefreshCw, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase/client';

interface RebuildMonthProps {
  sourceYear: number;
  sourceMonth: number;
  targetYear: number;
  targetMonth: number;
  onComplete: () => void;
}

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function RebuildMonth({
  sourceYear,
  sourceMonth,
  targetYear,
  targetMonth,
  onComplete,
}: RebuildMonthProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const handleRebuild = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setError('Not authenticated');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/fix-month', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          sourceMonth: `${sourceYear}-${String(sourceMonth).padStart(2, '0')}-01`,
          targetMonth: `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed');
      } else {
        setResult(
          `Rebuilt ${MONTH_NAMES[targetMonth]} ${targetYear}: ${data.inserted} transactions. ` +
          `Buffer carryover: $${data.bufferCarryover}. Fun money leftover: $${data.funMoneyLeftover.toFixed(2)}.`
        );
        onComplete();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Rebuild Month from Previous
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-zinc-500 mb-3">
          Add carryovers to <span className="text-zinc-900 dark:text-white font-medium">{MONTH_NAMES[targetMonth]} {targetYear}</span> from{' '}
          <span className="text-zinc-900 dark:text-white font-medium">{MONTH_NAMES[sourceMonth]} {sourceYear}</span>:
          buffer as income, fun money leftover, and any missing recurring items.
          Your existing expenses <span className="text-emerald-600 dark:text-emerald-400">won&apos;t be touched</span>.
        </p>

        <Button onClick={handleRebuild} disabled={loading} variant="outline" className="w-full">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Rebuilding...' : `Rebuild ${MONTH_NAMES[targetMonth]} ${targetYear}`}
        </Button>

        {result && (
          <div className="flex items-start gap-2 text-emerald-600 dark:text-emerald-400 text-xs mt-3">
            <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
            {result}
          </div>
        )}
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
