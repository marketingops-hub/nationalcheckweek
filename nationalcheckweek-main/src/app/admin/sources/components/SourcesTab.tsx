"use client";

import type { VaultSource, SourceCategory, SourceLink } from "@/lib/sources/types";
import { checkUrlSpecificity } from "@/lib/sources/validation";
import { FormField, TextInput, TextArea, Select, Button, Alert } from "@/components/shared/forms";
import { useFormState, useValidation } from "@/hooks/shared";
import { sourceCreateSchema } from "@/lib/adminSchemas";

interface SourcesTabProps {
  /** Array of sources to display */
  readonly sources: readonly VaultSource[];
  /** Array of links for counting */
  readonly links: readonly SourceLink[];
  /** Whether a submit operation is in progress */
  submitting: boolean;
  /** Callback to create a new source */
  onCreateSource: (data: {
    url: string;
    title: string;
    description: string;
    category: SourceCategory;
  }) => Promise<boolean>;
}

/**
 * SourcesTab - Display and manage vault sources.
 * 
 * Refactored to use shared form components for consistency and maintainability.
 * 
 * Features:
 * - Shared form components
 * - useFormState hook for state management
 * - URL specificity validation
 * - Accessible form fields
 * - Consistent styling
 * 
 * @param props - Component props
 * @returns Sources management interface
 */
export default function SourcesTab({ sources, links, submitting, onCreateSource }: SourcesTabProps) {
  const { formData, handleChange, resetForm, updateField } = useFormState({
    url: '',
    title: '',
    description: '',
    category: 'mental_health' as SourceCategory,
    showForm: false,
  });

  const { errors: validationErrors, validateForm, clearError } = useValidation(sourceCreateSchema);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form before submission
    if (!validateForm({
      url: formData.url,
      title: formData.title,
      description: formData.description,
      category: formData.category,
    })) {
      return;
    }

    const success = await onCreateSource({
      url: formData.url,
      title: formData.title,
      description: formData.description,
      category: formData.category,
    });
    if (success) {
      resetForm();
    }
  };

  const urlWarning = formData.url ? checkUrlSpecificity(formData.url) : null;

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <Button
          onClick={() => updateField('showForm', !formData.showForm)}
          disabled={submitting}
          variant={formData.showForm ? 'secondary' : 'primary'}
          testId="add-source-button"
        >
          {formData.showForm ? 'Cancel' : '+ Add New Source'}
        </Button>
      </div>

      {formData.showForm && (
        <div className="swa-card" style={{ marginBottom: '24px', padding: '24px' }} data-testid="source-form">
          <h3 style={{ marginBottom: '16px' }}>New Source</h3>
          <form onSubmit={handleSubmit}>
            <FormField 
              label="URL" 
              required
              error={validationErrors.url}
              helperText="💡 Important: Use the exact URL where the data was found, not just the homepage. Include #anchors or specific report pages for better credibility."
            >
              <TextInput
                name="url"
                type="url"
                value={formData.url}
                onChange={(e) => { handleChange(e); clearError('url'); }}
                error={!!validationErrors.url}
                placeholder="https://www.aihw.gov.au/reports/mental-health/youth-2024#key-findings"
                required
                disabled={submitting}
                testId="source-url-input"
              />
              {urlWarning && (
                <Alert
                  variant="warning"
                  message={urlWarning}
                />
              )}
            </FormField>

            <FormField label="Title" required error={validationErrors.title}>
              <TextInput
                name="title"
                value={formData.title}
                onChange={(e) => { handleChange(e); clearError('title'); }}
                error={!!validationErrors.title}
                placeholder="National Check-In Week - Melbourne"
                required
                disabled={submitting}
                testId="source-title-input"
              />
            </FormField>

            <FormField label="Description" error={validationErrors.description}>
              <TextArea
                name="description"
                value={formData.description}
                onChange={(e) => { handleChange(e); clearError('description'); }}
                error={!!validationErrors.description}
                placeholder="Melbourne youth mental health data and resources"
                rows={3}
                disabled={submitting}
                testId="source-description-input"
              />
            </FormField>

            <FormField label="Category">
              <Select
                name="category"
                value={formData.category}
                onChange={handleChange}
                disabled={submitting}
                testId="source-category-select"
              >
                <option value="mental_health">Mental Health</option>
                <option value="research">Research</option>
                <option value="government">Government</option>
                <option value="general">General</option>
              </Select>
            </FormField>

            <div style={{ display: 'flex', gap: '8px' }}>
              <Button 
                type="submit" 
                variant="primary"
                loading={submitting}
                testId="submit-source-button"
              >
                Add Source
              </Button>
              <Button 
                type="button" 
                variant="ghost"
                onClick={() => updateField('showForm', false)}
                disabled={submitting}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      <div className="swa-card" style={{ padding: 0 }} data-testid="sources-table">
        <table className="swa-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>URL</th>
              <th>Category</th>
              <th>Links</th>
            </tr>
          </thead>
          <tbody>
            {sources.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-faint)' }}>
                  No sources yet. Add your first source above.
                </td>
              </tr>
            ) : (
              sources.map(source => (
                <tr key={source.id}>
                  <td>
                    <strong>{source.title}</strong>
                    {source.description && (
                      <div style={{ fontSize: '12px', color: 'var(--color-text-faint)', marginTop: '4px' }}>
                        {source.description}
                      </div>
                    )}
                  </td>
                  <td>
                    <a href={source.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '13px' }}>
                      {source.domain} ↗
                    </a>
                  </td>
                  <td>
                    <span className="swa-badge">{source.category}</span>
                  </td>
                  <td>
                    {links.filter(l => l.source_id === source.id).length} entities
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
