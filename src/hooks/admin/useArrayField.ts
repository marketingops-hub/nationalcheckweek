import { useCallback } from 'react';

/**
 * Hook for managing array field operations (add, remove, update)
 * 
 * @param items - Current array of items
 * @param onChange - Callback to update the array
 * @returns Object with addItem, removeItem, and updateItem functions
 */
export function useArrayField(
  items: string[],
  onChange: (items: string[]) => void
) {
  const addItem = useCallback(() => {
    onChange([...items, '']);
  }, [items, onChange]);

  const removeItem = useCallback(
    (index: number) => {
      onChange(items.filter((_, i) => i !== index));
    },
    [items, onChange]
  );

  const updateItem = useCallback(
    (index: number, value: string) => {
      const newItems = [...items];
      newItems[index] = value;
      onChange(newItems);
    },
    [items, onChange]
  );

  return { addItem, removeItem, updateItem };
}
