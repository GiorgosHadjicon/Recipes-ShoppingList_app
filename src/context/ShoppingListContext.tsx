import React, { createContext, useCallback, useContext, useState } from 'react';
import type { ShoppingList } from '../types';
import { buildShoppingList, buildWeeklyShoppingList } from '../services/groceryListService';

interface ShoppingListState {
  list: ShoppingList | null;
  selectedSupermarketId: string;
  loading: boolean;
}

interface ShoppingListActions {
  generateList: (recipeId: string, supermarketId: string) => Promise<void>;
  generateWeeklyList: (recipeIds: string[], supermarketId: string) => Promise<void>;
  toggleItem: (aisleIndex: number, itemIndex: number) => void;
  clearList: () => void;
  setSelectedSupermarket: (id: string) => void;
}

const Context = createContext<(ShoppingListState & ShoppingListActions) | null>(null);

export function ShoppingListProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ShoppingListState>({
    list: null,
    selectedSupermarketId: 'alphamega',
    loading: false,
  });

  const generateList = useCallback(async (recipeId: string, supermarketId: string) => {
    setState((s) => ({ ...s, loading: true }));
    const list = await buildShoppingList(recipeId, supermarketId);
    setState((s) => ({ ...s, list, selectedSupermarketId: supermarketId, loading: false }));
  }, []);

  const generateWeeklyList = useCallback(async (recipeIds: string[], supermarketId: string) => {
    setState((s) => ({ ...s, loading: true }));
    const list = await buildWeeklyShoppingList(recipeIds, supermarketId);
    setState((s) => ({ ...s, list, selectedSupermarketId: supermarketId, loading: false }));
  }, []);

  const toggleItem = useCallback((aisleIndex: number, itemIndex: number) => {
    setState((s) => {
      if (!s.list) return s;
      const groups = s.list.groups.map((group, gi) => {
        if (gi !== aisleIndex) return group;
        return {
          ...group,
          items: group.items.map((item, ii) =>
            ii === itemIndex ? { ...item, checked: !item.checked } : item,
          ),
        };
      });
      return { ...s, list: { ...s.list, groups } };
    });
  }, []);

  const clearList = useCallback(() => {
    setState((s) => ({ ...s, list: null }));
  }, []);

  const setSelectedSupermarket = useCallback((id: string) => {
    setState((s) => ({ ...s, selectedSupermarketId: id }));
  }, []);

  return (
    <Context.Provider value={{ ...state, generateList, generateWeeklyList, toggleItem, clearList, setSelectedSupermarket }}>
      {children}
    </Context.Provider>
  );
}

export function useShoppingList() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error('useShoppingList must be used inside ShoppingListProvider');
  return ctx;
}
