"use client";

import { useState } from "react";
import type { VaultSource, SourceLink, EntityType, Relevance } from "@/lib/sources/types";

interface LinksTabProps {
  /** Array of sources for the dropdown */
  readonly sources: readonly VaultSource[];
  /** Array of links to display */
  readonly links: readonly (SourceLink & { source?: VaultSource })[];
  /** Whether a submit operation is in progress */
  submitting: boolean;
  /** Callback to create a new link */
  onCreateLink: (data: {
    sourceId: string;
    entityType: EntityType;
    entitySlug: string;
    relevance: Relevance;
    notes?: string;
  }) => Promise<boolean>;
  /** Callback to delete a link */
  onDeleteLink: (id: string) => void;
}

/**
 * LinksTab - Display and manage source-to-entity links.
 * 
 * Provides a table of links with add and delete functionality.
 * Links connect sources to specific entities (areas, states, issues, etc.).
 * 
 * @param props - Component props
 * @returns Links management interface
 */
export default function LinksTab({ 
  sources, 
  links, 
  submitting, 
  onCreateLink, 
  onDeleteLink 
}: LinksTabProps) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    source_id: '',
    entity_type: 'area' as EntityType,
    entity_slug: '',
    relevance: 'primary' as Relevance,
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onCreateLink({
      sourceId: formData.source_id,
      entityType: formData.entity_type,
      entitySlug: formData.entity_slug,
      relevance: formData.relevance,
      notes: formData.notes
    });
    if (success) {
      setFormData({ 
        source_id: '', 
        entity_type: 'area', 
        entity_slug: '', 
        relevance: 'primary', 
        notes: '' 
      });
      setShowForm(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <button
          onClick={() => setShowForm(!showForm)}
          disabled={submitting}
          className="swa-btn swa-btn--primary"
          data-testid="add-link-button"
        >
          {showForm ? 'Cancel' : '+ Link Source to Entity'}
        </button>
      </div>

      {showForm && (
        <div className="swa-card" style={{ marginBottom: '24px', padding: '24px' }} data-testid="link-form">
          <h3 style={{ marginBottom: '16px' }}>New Source Link</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="swa-form-label">Source *</label>
                <select
                  required
                  disabled={submitting}
                  value={formData.source_id}
                  onChange={e => setFormData({...formData, source_id: e.target.value})}
                  className="swa-form-input"
                  data-testid="link-source-select"
                >
                  <option value="">Select a source...</option>
                  {sources.map(s => (
                    <option key={s.id} value={s.id}>{s.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="swa-form-label">Entity Type *</label>
                <select
                  disabled={submitting}
                  value={formData.entity_type}
                  onChange={e => setFormData({...formData, entity_type: e.target.value as EntityType})}
                  className="swa-form-input"
                  data-testid="link-entity-type-select"
                >
                  <option value="area">Area</option>
                  <option value="state">State</option>
                  <option value="issue">Issue</option>
                  <option value="content">Content</option>
                  <option value="research_theme">Research Theme</option>
                </select>
              </div>
              <div>
                <label className="swa-form-label">Entity Slug * (e.g., 'melbourne', 'victoria')</label>
                <input
                  type="text"
                  required
                  disabled={submitting}
                  value={formData.entity_slug}
                  onChange={e => setFormData({...formData, entity_slug: e.target.value})}
                  className="swa-form-input"
                  placeholder="melbourne"
                  data-testid="link-entity-slug-input"
                />
              </div>
              <div>
                <label className="swa-form-label">Relevance</label>
                <select
                  disabled={submitting}
                  value={formData.relevance}
                  onChange={e => setFormData({...formData, relevance: e.target.value as Relevance})}
                  className="swa-form-input"
                  data-testid="link-relevance-select"
                >
                  <option value="primary">Primary</option>
                  <option value="secondary">Secondary</option>
                  <option value="reference">Reference</option>
                </select>
              </div>
              <div>
                <label className="swa-form-label">Notes</label>
                <textarea
                  disabled={submitting}
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  className="swa-form-input"
                  rows={2}
                  placeholder="Optional context about this link"
                  data-testid="link-notes-input"
                />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  type="submit" 
                  disabled={submitting} 
                  className="swa-btn swa-btn--primary"
                  data-testid="submit-link-button"
                >
                  {submitting ? 'Creating...' : 'Create Link'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setShowForm(false)} 
                  disabled={submitting}
                  className="swa-btn swa-btn--ghost"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="swa-card" style={{ padding: 0 }} data-testid="links-table">
        <table className="swa-table">
          <thead>
            <tr>
              <th>Source</th>
              <th>Entity</th>
              <th>Relevance</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {links.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-faint)' }}>
                  No links yet. Create your first link above.
                </td>
              </tr>
            ) : (
              links.map(link => (
                <tr key={link.id}>
                  <td>
                    <strong>{link.source?.title || 'Unknown'}</strong>
                  </td>
                  <td>
                    <span className="swa-badge">{link.entity_type}</span>
                    {' '}
                    <code style={{ fontSize: '12px' }}>{link.entity_slug}</code>
                    {link.notes && (
                      <div style={{ fontSize: '12px', color: 'var(--color-text-faint)', marginTop: '4px' }}>
                        {link.notes}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className={`swa-badge ${
                      link.relevance === 'primary' ? 'swa-badge--success' :
                      link.relevance === 'secondary' ? 'swa-badge--info' : ''
                    }`}>
                      {link.relevance}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={() => onDeleteLink(link.id)}
                      disabled={submitting}
                      className="swa-btn swa-btn--ghost"
                      style={{ fontSize: '12px', padding: '4px 8px' }}
                      data-testid={`delete-link-${link.id}`}
                    >
                      {submitting ? 'Deleting...' : 'Delete'}
                    </button>
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
