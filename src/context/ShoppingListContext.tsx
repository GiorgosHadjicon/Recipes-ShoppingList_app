import React, { createContext, useCallback, useContext, useState } from 'react';
import type { ShoppingList } from '../types';
import { buildShoppingList } from '../services/groceryListService';

interface ShoppingListState {
  list: ShoppingList | null;
  loading: boolean;
}

interface ShoppingListActions {
  generateList: (recipeId: string) => Promise<void>;
  toggleItem: (aisleIndex: number, itemIndex: number) => void;
  clearList: () => void;
}

const Context = createContext<(ShoppingListState & ShoppingListActions) | null>(null);

export function ShoppingListProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ShoppingListState>({ list: null, loading: false });

  const generateList = useCallback(async (recipeId: string) => {
    setState((s) => ({ ...s, loading: true }));
    const list = await buildShoppingList(recipeId);
    setState({ list, loading: false });
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

  return (
    <Context.Provider value={{ ...state, generateList, toggleItem, clearList }}>
      {children}
    </Context.Provider>
  );
}

export function useShoppingList() {
  const ctx = useContext(Context);
  if (!ctx) throw new Error('useShoppingList must be used inside ShoppingListProvider');
  return ctx;
}
