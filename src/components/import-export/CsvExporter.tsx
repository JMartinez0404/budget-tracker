'use client';

import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { exportMonthToCsv } from '@/lib/csv/exporter';
import type { CategoryWithTransactions } from '@/lib/types';

interface CsvExporterProps {
  year: number;
  month: number;
  categories: CategoryWithTransactions[];
}

export function CsvExporter({ year, month, categories }: CsvExporterProps) {
  const handleExport = () => {
    const csv = exportMonthToCsv(year, month, categories);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;

    const monthNames = [
      '', 'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];
    link.download = `Budget_${monthNames[month]}_${year}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-zinc-500 mb-3">
          Download the current month&apos;s data as a CSV file.
        </p>
        <Button onClick={handleExport} variant="outline" className="w-full border-zinc-700">
          <Download className="w-4 h-4 mr-2" />
          Export Current Month
        </Button>
      </CardContent>
    </Card>
  );
}
