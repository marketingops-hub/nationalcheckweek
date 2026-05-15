'use client';

import { useState, useEffect } from 'react';
import { adminFetch } from '@/lib/adminFetch';

interface ContentBlock {
  type: 'heading' | 'paragraph' | 'list';
  content?: string;
  items?: string[];
}

interface RegisterPageData {
  id: string;
  heading: string;
  subheading: string | null;
  description: string | null;
  right_column_content: ContentBlock[];
  hubspot_form_id: string | null;
  hubspot_portal_id: string | null;
  seo_title: string | null;
  seo_description: string | null;
  background_color: string;
}

export default function RegisterPageEditor() {
  const [data, setData] = useState<RegisterPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const res = await adminFetch('/api/admin/register-page');
      const json = await res.json();
      setData(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load page');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!data) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const res = await adminFetch('/api/admin/register-page', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Failed to save');
      }

      setSuccess('Register page updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  const updateField = (field: keyof RegisterPageData, value: any) => {
    if (!data) return;
    setData({ ...data, [field]: value });
  };

  const addContentBlock = (type: 'heading' | 'paragraph' | 'list') => {
    if (!data) return;
    const newBlock: ContentBlock = type === 'list' 
      ? { type, items: [''] }
      : { type, content: '' };
    
    updateField('right_column_content', [...data.right_column_content, newBlock]);
  };

  const updateContentBlock = (index: number, updates: Partial<ContentBlock>) => {
    if (!data) return;
    const updated = [...data.right_column_content];
    updated[index] = { ...updated[index], ...updates };
    updateField('right_column_content', updated);
  };

  const removeContentBlock = (index: number) => {
    if (!data) return;
    updateField('right_column_content', data.right_column_content.filter((_, i) => i !== index));
  };

  const updateListItem = (blockIndex: number, itemIndex: number, value: string) => {
    if (!data) return;
    const block = data.right_column_content[blockIndex];
    if (block.type === 'list' && block.items) {
      const newItems = [...block.items];
      newItems[itemIndex] = value;
      updateContentBlock(blockIndex, { items: newItems });
    }
  };

  const addListItem = (blockIndex: number) => {
    if (!data) return;
    const block = data.right_column_content[blockIndex];
    if (block.type === 'list' && block.items) {
      updateContentBlock(blockIndex, { items: [...block.items, ''] });
    }
  };

  const removeListItem = (blockIndex: number, itemIndex: number) => {
    if (!data) return;
    const block = data.right_column_content[blockIndex];
    if (block.type === 'list' && block.items) {
      updateContentBlock(blockIndex, { items: block.items.filter((_, i) => i !== itemIndex) });
    }
  };

  if (loading) {
    return <div className="swa-loading">Loading register page...</div>;
  }

  if (!data) {
    return <div className="swa-error">Failed to load register page</div>;
  }

  return (
    <div className="swa-container">
      <div className="swa-header">
        <h1 className="swa-title">Register Page Editor</h1>
        <p className="swa-subtitle">Manage the /register page content and HubSpot form integration</p>
      </div>

      {error && <div className="swa-error">{error}</div>}
      {success && <div className="swa-success">{success}</div>}

      <div className="swa-card">
        <h2 className="swa-section-title">Page Header</h2>

        <div className="swa-form-group">
          <label className="swa-label">Main Heading</label>
          <input
            type="text"
            value={data.heading}
            onChange={(e) => updateField('heading', e.target.value)}
            className="swa-input"
            placeholder="Register for National Check-In Week 2026"
          />
        </div>

        <div className="swa-form-group">
          <label className="swa-label">Subheading</label>
          <input
            type="text"
            value={data.subheading || ''}
            onChange={(e) => updateField('subheading', e.target.value)}
            className="swa-input"
            placeholder="Join leading educators, psychologists, and experts"
          />
        </div>

        <div className="swa-form-group">
          <label className="swa-label">Description</label>
          <textarea
            value={data.description || ''}
            onChange={(e) => updateField('description', e.target.value)}
            className="swa-input"
            rows={3}
            placeholder="Complete the form to register..."
          />
        </div>
      </div>

      <div className="swa-card">
        <h2 className="swa-section-title">HubSpot Form Integration</h2>

        <div className="swa-form-group">
          <label className="swa-label">HubSpot Portal ID</label>
          <input
            type="text"
            value={data.hubspot_portal_id || ''}
            onChange={(e) => updateField('hubspot_portal_id', e.target.value)}
            className="swa-input"
            placeholder="12345678"
          />
          <small style={{ color: '#7b78a0', fontSize: '0.875rem' }}>
            Find this in your HubSpot account settings
          </small>
        </div>

        <div className="swa-form-group">
          <label className="swa-label">HubSpot Form ID</label>
          <input
            type="text"
            value={data.hubspot_form_id || ''}
            onChange={(e) => updateField('hubspot_form_id', e.target.value)}
            className="swa-input"
            placeholder="abcd1234-5678-90ef-ghij-klmnopqrstuv"
          />
          <small style={{ color: '#7b78a0', fontSize: '0.875rem' }}>
            Find this in your HubSpot form embed code
          </small>
        </div>
      </div>

      <div className="swa-card">
        <h2 className="swa-section-title">Right Column Content</h2>

        {data.right_column_content.map((block, blockIndex) => (
          <div key={blockIndex} style={{ 
            border: '1px solid #e4e2ec', 
            borderRadius: '8px', 
            padding: '16px', 
            marginBottom: '16px',
            background: '#f8f9fa'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <strong style={{ textTransform: 'capitalize' }}>{block.type} Block</strong>
              <button
                onClick={() => removeContentBlock(blockIndex)}
                className="swa-btn-secondary"
                style={{ padding: '4px 12px', fontSize: '0.875rem' }}
              >
                Remove
              </button>
            </div>

            {block.type === 'heading' && (
              <div className="swa-form-group">
                <input
                  type="text"
                  value={block.content || ''}
                  onChange={(e) => updateContentBlock(blockIndex, { content: e.target.value })}
                  className="swa-input"
                  placeholder="Heading text..."
                />
              </div>
            )}

            {block.type === 'paragraph' && (
              <div className="swa-form-group">
                <textarea
                  value={block.content || ''}
                  onChange={(e) => updateContentBlock(blockIndex, { content: e.target.value })}
                  className="swa-input"
                  rows={3}
                  placeholder="Paragraph text..."
                />
              </div>
            )}

            {block.type === 'list' && block.items && (
              <div className="swa-form-group">
                {block.items.map((item, itemIndex) => (
                  <div key={itemIndex} style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => updateListItem(blockIndex, itemIndex, e.target.value)}
                      className="swa-input"
                      placeholder="List item..."
                      style={{ flex: 1 }}
                    />
                    <button
                      onClick={() => removeListItem(blockIndex, itemIndex)}
                      className="swa-btn-secondary"
                      style={{ padding: '8px 16px' }}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addListItem(blockIndex)}
                  className="swa-btn-secondary"
                  style={{ width: '100%', marginTop: '8px' }}
                >
                  + Add Item
                </button>
              </div>
            )}
          </div>
        ))}

        <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
          <button onClick={() => addContentBlock('heading')} className="swa-btn-secondary">
            + Add Heading
          </button>
          <button onClick={() => addContentBlock('paragraph')} className="swa-btn-secondary">
            + Add Paragraph
          </button>
          <button onClick={() => addContentBlock('list')} className="swa-btn-secondary">
            + Add List
          </button>
        </div>
      </div>

      <div className="swa-card">
        <h2 className="swa-section-title">SEO Settings</h2>

        <div className="swa-form-group">
          <label className="swa-label">SEO Title</label>
          <input
            type="text"
            value={data.seo_title || ''}
            onChange={(e) => updateField('seo_title', e.target.value)}
            className="swa-input"
            placeholder="Register - National Check-In Week 2026"
          />
        </div>

        <div className="swa-form-group">
          <label className="swa-label">SEO Description</label>
          <textarea
            value={data.seo_description || ''}
            onChange={(e) => updateField('seo_description', e.target.value)}
            className="swa-input"
            rows={2}
            placeholder="Meta description for search engines..."
          />
        </div>
      </div>

      <div className="swa-actions">
        <button onClick={handleSave} disabled={saving} className="swa-btn-primary">
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
        <a href="/register" target="_blank" rel="noopener noreferrer" className="swa-btn-secondary">
          Preview Page
        </a>
      </div>
    </div>
  );
}
