'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MonthIndex() {
  const router = useRouter();
  useEffect(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    router.replace(`/month/${y}-${m}`);
  }, [router]);
  return null;
}
