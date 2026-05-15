import { useState, useCallback } from 'react';
import { z } from 'zod';

interface ValidationErrors {
  [key: string]: string;
}

/**
 * useValidation - Hook for form validation with Zod schemas
 * 
 * Provides real-time validation with field-level and form-level validation.
 * 
 * Features:
 * - Field-level validation on blur/change
 * - Form-level validation on submit
 * - Clear, user-friendly error messages
 * - Type-safe with Zod schemas
 * 
 * @param schema - Zod schema for validation
 * 
 * @example
 * ```tsx
 * const { errors, validateField, validateForm, clearError } = useValidation(sourceCreateSchema);
 * 
 * // Validate single field
 * const handleBlur = (field: string, value: any) => {
 *   validateField(field, value);
 * };
 * 
 * // Validate entire form
 * const handleSubmit = async (data: any) => {
 *   if (!validateForm(data)) return;
 *   // Submit form
 * };
 * ```
 */
export function useValidation<T extends z.ZodTypeAny>(schema: T) {
  const [errors, setErrors] = useState<ValidationErrors>({});

  /**
   * Validate a single field
   */
  const validateField = useCallback((field: string, value: any) => {
    try {
      // Get the field schema
      if (schema instanceof z.ZodObject) {
        const fieldSchema = schema.shape[field];
        if (fieldSchema) {
          fieldSchema.parse(value);
          // Clear error if validation passes
          setErrors(prev => {
            const next = { ...prev };
            delete next[field];
            return next;
          });
          return true;
        }
      }
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const message = error.issues[0]?.message || 'Invalid value';
        setErrors(prev => ({ ...prev, [field]: message }));
        return false;
      }
      return false;
    }
  }, [schema]);

  /**
   * Validate entire form
   */
  const validateForm = useCallback((data: any): data is z.infer<T> => {
    try {
      schema.parse(data);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: ValidationErrors = {};
        error.issues.forEach(issue => {
          const field = issue.path[0]?.toString();
          if (field) {
            newErrors[field] = issue.message;
          }
        });
        setErrors(newErrors);
        return false;
      }
      return false;
    }
  }, [schema]);

  /**
   * Clear error for a specific field
   */
  const clearError = useCallback((field: string) => {
    setErrors(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  /**
   * Clear all errors
   */
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  return {
    errors,
    validateField,
    validateForm,
    clearError,
    clearErrors,
  };
}
