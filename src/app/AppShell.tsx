'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { Navbar } from '@/components/layout/Navbar';
import { LoginPage } from './login/LoginPage';

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-500 text-sm">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Navbar onSignOut={signOut} />
      {/* Desktop: offset by sidebar width. Mobile: offset by top bar height */}
      <main className="md:ml-56 pt-14 md:pt-0 p-4 md:p-6">
        {children}
      </main>
    </div>
  );
}
