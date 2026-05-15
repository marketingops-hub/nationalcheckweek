import { useState, useCallback } from "react";
import { adminFetch } from "@/lib/adminFetch";

/**
 * Custom hook for saving settings to the API with loading, error, and success states.
 * 
 * @template T - The type of data being saved
 * @param endpoint - API endpoint to send the PATCH request to
 * @param successMessage - Message to display on successful save
 * @returns Object containing save function and state
 * 
 * @example
 * ```tsx
 * const { save, saving, error, success, clearMessages } = useSaveSettings<HeroSettings>(
 *   '/api/admin/home-page/hero',
 *   'Hero settings saved successfully!'
 * );
 * 
 * await save(heroSettings);
 * ```
 */
export function useSaveSettings<T>(endpoint: string, successMessage: string) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const save = useCallback(async (data: T): Promise<boolean> => {
    setSaving(true);
    setError("");
    setSuccess("");
    
    try {
      const res = await adminFetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.message || 
          errorData.error || 
          `Failed to save settings (${res.status}: ${res.statusText})`
        );
      }
      
      setSuccess(successMessage);
      
      // Auto-clear success message after 5 seconds
      setTimeout(() => setSuccess(""), 5000);
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error 
        ? err.message 
        : "An unexpected error occurred while saving";
      setError(errorMessage);
      
      // Auto-clear error message after 10 seconds
      setTimeout(() => setError(""), 10000);
      
      return false;
    } finally {
      setSaving(false);
    }
  }, [endpoint, successMessage]);

  const clearMessages = useCallback(() => {
    setError("");
    setSuccess("");
  }, []);

  return { save, saving, error, success, clearMessages };
}
