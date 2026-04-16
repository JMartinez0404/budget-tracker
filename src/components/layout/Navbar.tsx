'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  CalendarDays,
  TrendingUp,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ThemeToggle } from './ThemeToggle';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/month', label: 'Monthly', icon: CalendarDays },
  { href: '/trends', label: 'Trends', icon: TrendingUp },
  { href: '/settings', label: 'Settings', icon: Settings },
];

interface NavbarProps {
  onSignOut: () => void;
}

export function Navbar({ onSignOut }: NavbarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop nav */}
      <nav className="hidden md:flex fixed left-0 top-0 bottom-0 w-56 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 flex-col p-4 z-50">
        <div className="mb-8">
          <h1 className="text-lg font-bold text-zinc-900 dark:text-white tracking-tight">Budget Tracker</h1>
          <p className="text-xs text-zinc-500 mt-1">Joel&apos;s Finance</p>
        </div>
        <div className="flex flex-col gap-1 flex-1">
          {navItems.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  active
                    ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900',
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            onClick={onSignOut}
            className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white justify-start gap-3 px-3 flex-1"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </Button>
          <ThemeToggle />
        </div>
      </nav>

      {/* Mobile nav */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 px-4 py-3 flex items-center justify-between z-50">
        <h1 className="text-sm font-bold text-zinc-900 dark:text-white">Budget Tracker</h1>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className="inline-flex items-center justify-center rounded-md text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white h-9 w-9">
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </SheetTrigger>
            <SheetContent side="right" className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 w-64 p-4">
              <div className="flex flex-col gap-1 mt-8">
                {navItems.map(item => {
                  const active = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                        active
                          ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white'
                          : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900',
                      )}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  );
                })}
                <Button
                  variant="ghost"
                  onClick={() => { setOpen(false); onSignOut(); }}
                  className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white justify-start gap-3 px-3 mt-4"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </>
  );
}
