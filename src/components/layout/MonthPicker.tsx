'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface MonthPickerProps {
  year: number;
  month: number; // 1-12
  onChange: (year: number, month: number) => void;
}

export function MonthPicker({ year, month, onChange }: MonthPickerProps) {
  const prev = () => {
    if (month === 1) onChange(year - 1, 12);
    else onChange(year, month - 1);
  };

  const next = () => {
    if (month === 12) onChange(year + 1, 1);
    else onChange(year, month + 1);
  };

  return (
    <div className="flex items-center gap-3">
      <Button variant="ghost" size="icon" onClick={prev} className="text-zinc-400 hover:text-white">
        <ChevronLeft className="w-5 h-5" />
      </Button>
      <div className="text-center min-w-[160px]">
        <div className="text-lg font-bold text-white">{MONTH_NAMES[month - 1]}</div>
        <div className="text-xs text-zinc-500">{year}</div>
      </div>
      <Button variant="ghost" size="icon" onClick={next} className="text-zinc-400 hover:text-white">
        <ChevronRight className="w-5 h-5" />
      </Button>
    </div>
  );
}
