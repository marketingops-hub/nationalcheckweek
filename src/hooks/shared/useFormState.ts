import { useState, useCallback } from 'react';

/**
 * Generic form state management hook.
 * 
 * Provides type-safe form state management with change handlers
 * and reset functionality.
 * 
 * Features:
 * - Type-safe form state
 * - Generic change handler
 * - Reset to initial values
 * - Batch updates
 * 
 * @example
 * ```tsx
 * const { formData, handleChange, setFormData, resetForm } = useFormState({
 *   email: '',
 *   password: '',
 * });
 * 
 * <input
 *   name="email"
 *   value={formData.email}
 *   onChange={handleChange}
 * />
 * ```
 */
export function useFormState<T extends Record<string, any>>(initialState: T) {
  const [formData, setFormData] = useState<T>(initialState);

  /**
   * Handle input change events.
   * Works with both input and select elements.
   */
  const handleChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    
    // Handle checkbox inputs
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
      return;
    }
    
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  /**
   * Update a specific field programmatically.
   */
  const updateField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  /**
   * Reset form to initial state.
   */
  const resetForm = useCallback(() => {
    setFormData(initialState);
  }, [initialState]);

  return {
    formData,
    setFormData,
    handleChange,
    updateField,
    resetForm,
  };
}
