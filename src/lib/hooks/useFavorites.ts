'use client';

import { useState, useEffect, useCallback } from 'react';

export interface TransactionFavorite {
  id: string;
  name: string;
  amount: number;
  category_id: string;
}

export function useFavorites(userId: string | undefined) {
  const key = userId ? `budget-tracker-favorites-${userId}` : null;
  const [favorites, setFavorites] = useState<TransactionFavorite[]>([]);

  useEffect(() => {
    if (!key) return;
    try {
      const raw = localStorage.getItem(key);
      if (raw) setFavorites(JSON.parse(raw));
    } catch { /* ignore */ }
  }, [key]);

  const addFavorite = useCallback((fav: Omit<TransactionFavorite, 'id'>) => {
    setFavorites(prev => {
      const updated = [...prev, { ...fav, id: crypto.randomUUID() }];
      if (key) localStorage.setItem(key, JSON.stringify(updated));
      return updated;
    });
  }, [key]);

  const removeFavorite = useCallback((id: string) => {
    setFavorites(prev => {
      const updated = prev.filter(f => f.id !== id);
      if (key) localStorage.setItem(key, JSON.stringify(updated));
      return updated;
    });
  }, [key]);

  const findFavorite = useCallback((name: string, categoryId: string) =>
    favorites.find(
      f => f.name.toLowerCase() === name.toLowerCase() && f.category_id === categoryId
    ),
    [favorites]
  );

  const isFavorite = useCallback((name: string, categoryId: string) =>
    !!favorites.find(
      f => f.name.toLowerCase() === name.toLowerCase() && f.category_id === categoryId
    ),
    [favorites]
  );

  return { favorites, addFavorite, removeFavorite, isFavorite, findFavorite };
}
