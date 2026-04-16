'use client';

import { Sun, Moon, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme, type Theme } from './ThemeProvider';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
  label?: string;
}

const OPTIONS: Array<{ value: Theme; label: string; Icon: typeof Sun }> = [
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
  { value: 'system', label: 'System', Icon: Monitor },
];

export function ThemeToggle({ className, label }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const TriggerIcon = resolvedTheme === 'dark' ? Moon : Sun;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={(props) => (
          <Button
            {...props}
            variant="ghost"
            size={label ? undefined : 'icon'}
            className={cn(
              'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white',
              label && 'justify-start gap-3 px-3 w-full',
              className,
            )}
            aria-label="Toggle theme"
          >
            <TriggerIcon className="w-4 h-4" />
            {label ? <span>{label}</span> : null}
          </Button>
        )}
      />
      <DropdownMenuContent align="end" className="min-w-36">
        {OPTIONS.map(({ value, label: optLabel, Icon }) => (
          <DropdownMenuItem
            key={value}
            onClick={() => setTheme(value)}
            className={cn(
              'gap-2',
              theme === value && 'bg-accent text-accent-foreground',
            )}
          >
            <Icon className="w-4 h-4" />
            {optLabel}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
