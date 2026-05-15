/**
 * Reusable form field component with validation and character counting
 * 
 * Provides a consistent interface for text inputs and textareas with:
 * - Character count display
 * - Max length validation
 * - Required field indicators
 * - Error state styling
 * - Help text support
 * 
 * @module FormField
 */

'use client';

/**
 * Props for FormField component
 */
interface FormFieldProps {
  /** Label text displayed above the field */
  label: string;
  /** Current value of the field */
  value: string;
  /** Callback fired when value changes */
  onChange: (value: string) => void;
  /** Field type - text input or textarea */
  type?: 'text' | 'textarea';
  /** Number of rows for textarea (ignored for text inputs) */
  rows?: number;
  /** Maximum character length (shows counter if provided) */
  maxLength?: number;
  /** Whether the field is required */
  required?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Help text displayed below the field */
  helpText?: string;
}

/**
 * FormField Component
 * 
 * Reusable form field with built-in validation and character counting.
 * Automatically shows error state when value exceeds max length.
 * 
 * @param props - Component props
 * @returns Rendered form field
 * 
 * @example
 * ```tsx
 * <FormField
 *   label="Title"
 *   value={title}
 *   onChange={setTitle}
 *   maxLength={200}
 *   required
 *   placeholder="Enter a title"
 * />
 * ```
 */
export default function FormField({
  label,
  value,
  onChange,
  type = 'text',
  rows = 3,
  maxLength,
  required = false,
  placeholder,
  helpText,
}: FormFieldProps) {
  const showCharCount = maxLength !== undefined;
  const isOverLimit = maxLength !== undefined && value.length > maxLength;

  return (
    <div>
      <label className="swa-form-label">
        {label}
        {required && <span style={{ color: 'var(--color-error)', marginLeft: 4 }}>*</span>}
      </label>
      {type === 'textarea' ? (
        <textarea
          className="swa-form-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          maxLength={maxLength}
          required={required}
          placeholder={placeholder}
          style={{
            borderColor: isOverLimit ? 'var(--color-error)' : undefined,
          }}
        />
      ) : (
        <input
          className="swa-form-input"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={maxLength}
          required={required}
          placeholder={placeholder}
          style={{
            borderColor: isOverLimit ? 'var(--color-error)' : undefined,
          }}
        />
      )}
      {(showCharCount || helpText) && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginTop: 4,
          fontSize: 12,
        }}>
          {helpText && (
            <span style={{ color: 'var(--color-text-faint)' }}>
              {helpText}
            </span>
          )}
          {showCharCount && (
            <span style={{ 
              color: isOverLimit ? 'var(--color-error)' : 'var(--color-text-faint)',
              marginLeft: 'auto',
            }}>
              {value.length}/{maxLength}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
