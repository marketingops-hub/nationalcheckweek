import { useCallback } from 'react';
import { BlockColors } from '@/types/homepage-blocks';

/**
 * Hook for managing block color changes
 * Automatically sets useGlobalColors to false when any color is changed
 * 
 * @param colors - Current block colors
 * @param onChange - Callback to update the block content
 * @returns Object with handleColorChange function
 */
export function useBlockColors(
  colors: BlockColors | undefined,
  onChange: (key: string, value: unknown) => void
) {
  const handleColorChange = useCallback(
    (colorKey: string, value: string) => {
      onChange('colors', {
        ...(colors || {}),
        useGlobalColors: false,
        [colorKey]: value,
      });
    },
    [colors, onChange]
  );

  return { handleColorChange };
}
