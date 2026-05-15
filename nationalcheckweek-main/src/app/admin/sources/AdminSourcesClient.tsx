"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import SourcesTab from "./components/SourcesTab";
import LinksTab from "./components/LinksTab";
import ConfirmDialog from "./components/ConfirmDialog";
import { useSources } from "./hooks/useSources";
import { useSourceLinks } from "./hooks/useSourceLinks";
import type { SourceCategory, EntityType, Relevance } from "@/lib/sources/types";

type Tab = 'sources' | 'links';

/**
 * Tab configuration for source management.
 */
const TABS = [
  { id: 'sources' as const, label: 'Sources' },
  { id: 'links' as const, label: 'Links' },
] as const;

/**
 * AdminSourcesClient - Admin interface for managing sources and source links.
 * 
 * Provides a tabbed interface for:
 * - Managing vault sources (URLs, titles, descriptions, categories)
 * - Linking sources to entities (areas, states, issues, content, research themes)
 * 
 * Features:
 * - Custom hooks for data management
 * - Accessible modal dialogs
 * - Comprehensive error handling
 * - Auto-dismiss success messages
 * - URL specificity validation
 * 
 * @example
 * ```tsx
 * import AdminSourcesClient from '@/app/admin/sources/AdminSourcesClient';
 * 
 * export default function SourcesPage() {
 *   return <AdminSourcesClient />;
 * }
 * ```
 */
export default function AdminSourcesClient() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('sources');
  const [submitting, setSubmitting] = useState(false);
  const [deleteLinkId, setDeleteLinkId] = useState<string | null>(null);

  // Custom hooks for data management
  const sourcesHook = useSources();
  const linksHook = useSourceLinks();

  // Aggregate error and success messages
  const error = sourcesHook.error || linksHook.error;
  const success = sourcesHook.success || linksHook.success;
  const loading = sourcesHook.loading || linksHook.loading;

  /**
   * Check authentication and load initial data.
   */
  const checkAuthAndLoad = useCallback(async () => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      router.push('/login');
      return;
    }
    
    await Promise.all([
      sourcesHook.fetchSources(),
      linksHook.fetchLinks()
    ]);
  }, [router, sourcesHook, linksHook]);

  useEffect(() => {
    checkAuthAndLoad();
  }, [checkAuthAndLoad]);

  /**
   * Handle creating a new source.
   */
  const handleCreateSource = useCallback(async (data: {
    url: string;
    title: string;
    description: string;
    category: SourceCategory;
  }) => {
    setSubmitting(true);
    const success = await sourcesHook.createSource(data);
    setSubmitting(false);
    return success;
  }, [sourcesHook]);

  /**
   * Handle creating a new link.
   */
  const handleCreateLink = useCallback(async (data: {
    sourceId: string;
    entityType: EntityType;
    entitySlug: string;
    relevance: Relevance;
    notes?: string;
  }) => {
    setSubmitting(true);
    const success = await linksHook.createLink(data);
    setSubmitting(false);
    return success;
  }, [linksHook]);

  /**
   * Handle deleting a link with confirmation.
   */
  const handleDeleteLink = useCallback(async () => {
    if (!deleteLinkId) return;
    
    setSubmitting(true);
    await linksHook.removeLink(deleteLinkId);
    setSubmitting(false);
    setDeleteLinkId(null);
  }, [deleteLinkId, linksHook]);

  return (
    <div data-testid="admin-sources-client">
      <div className="swa-page-header">
        <div>
          <h1 className="swa-page-title">Source Management</h1>
          <p className="swa-page-subtitle">
            Manage sources and link them to areas, states, and issues
          </p>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div 
          className="swa-alert swa-alert--error" 
          style={{ marginBottom: 16 }}
          role="alert"
          aria-live="assertive"
        >
          {error}
        </div>
      )}
      {success && (
        <div 
          className="swa-alert swa-alert--success" 
          style={{ marginBottom: 16 }}
          role="status"
          aria-live="polite"
        >
          {success}
        </div>
      )}

      {/* Tabs */}
      <div 
        role="tablist"
        aria-label="Source management sections"
        style={{ 
          display: 'flex', 
          gap: '8px', 
          marginBottom: '24px', 
          borderBottom: '2px solid #E5E7EB' 
        }}
      >
        {TABS.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`${tab.id}-panel`}
            onClick={() => setActiveTab(tab.id)}
            disabled={submitting}
            data-testid={`tab-${tab.id}`}
            style={{
              padding: '12px 24px',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--color-primary)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-body)',
              fontWeight: activeTab === tab.id ? '600' : '400',
              cursor: submitting ? 'not-allowed' : 'pointer',
              marginBottom: '-2px'
            }}
          >
            {tab.label} ({tab.id === 'sources' ? sourcesHook.sources.length : linksHook.links.length})
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loading && (
        <div 
          style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-faint)' }}
          data-testid="loading-state"
        >
          Loading sources...
        </div>
      )}

      {/* Tab Panels */}
      {!loading && (
        <>
          <div 
            role="tabpanel" 
            id="sources-panel" 
            aria-labelledby="sources-tab"
            hidden={activeTab !== 'sources'}
          >
            {activeTab === 'sources' && (
              <SourcesTab
                sources={sourcesHook.sources}
                links={linksHook.links}
                submitting={submitting}
                onCreateSource={handleCreateSource}
              />
            )}
          </div>

          <div 
            role="tabpanel" 
            id="links-panel" 
            aria-labelledby="links-tab"
            hidden={activeTab !== 'links'}
          >
            {activeTab === 'links' && (
              <LinksTab
                sources={sourcesHook.sources}
                links={linksHook.links}
                submitting={submitting}
                onCreateLink={handleCreateLink}
                onDeleteLink={(id) => setDeleteLinkId(id)}
              />
            )}
          </div>
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteLinkId !== null}
        title="Delete Source Link"
        message="Are you sure you want to delete this source link? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteLink}
        onCancel={() => setDeleteLinkId(null)}
      />
    </div>
  );
}
