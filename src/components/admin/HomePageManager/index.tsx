"use client";

import { useState, useCallback } from "react";
import { adminFetch } from "@/lib/adminFetch";
import HeroTab from "./HeroTab";
import LogosTab from "./LogosTab";
import CTATab from "./CTATab";
import FooterTab from "./FooterTab";
import ConfirmDialog from "./components/ConfirmDialog";
import InputDialog from "./components/InputDialog";
import { useHomePageData } from "./hooks/useHomePageData";
import { useSaveSettings } from "./hooks/useSaveSettings";
import type { Tab, Logo } from "./types";

/**
 * Tab configuration for the homepage manager.
 * Defines the available tabs and their display properties.
 */
const TABS = [
  { id: "hero" as const, label: "Hero Section", icon: "home" },
  { id: "logos" as const, label: "Trusted Logos", icon: "business" },
  { id: "cta" as const, label: "CTA Banner", icon: "campaign" },
  { id: "footer" as const, label: "Footer", icon: "web" },
] as const;

/**
 * HomePageManager - Admin interface for managing homepage content.
 * 
 * Provides a tabbed interface for editing:
 * - Hero section (logo, headings, CTAs, colors)
 * - Trusted organisation logos
 * - CTA banner settings
 * - Footer content and styling
 * 
 * Features:
 * - Real-time preview of changes
 * - Accessible modal dialogs
 * - Optimistic UI updates
 * - Comprehensive error handling
 * - Auto-save with success/error feedback
 * 
 * @example
 * ```tsx
 * import HomePageManager from '@/components/admin/HomePageManager';
 * 
 * export default function HomePage() {
 *   return <HomePageManager />;
 * }
 * ```
 */

export default function HomePageManager() {
  const [activeTab, setActiveTab] = useState<Tab>("hero");
  
  // Fetch all homepage data with custom hook
  const { 
    data, 
    loading, 
    error: fetchError, 
    setHeroSettings, 
    setLogos, 
    setCTASettings, 
    setFooterSettings 
  } = useHomePageData();
  
  // Save hooks for each section
  const heroSave = useSaveSettings(
    "/api/admin/home-page/hero",
    "Hero settings saved successfully!"
  );
  const ctaSave = useSaveSettings(
    "/api/admin/home-page/cta",
    "CTA settings saved successfully!"
  );
  const footerSave = useSaveSettings(
    "/api/admin/home-page/footer",
    "Footer settings saved successfully!"
  );
  
  // Dialog states
  const [showAddLogoDialog, setShowAddLogoDialog] = useState(false);
  const [deleteLogoState, setDeleteLogoState] = useState<{ id: string; name: string } | null>(null);
  
  // Aggregate error and success messages
  const error = fetchError || heroSave.error || ctaSave.error || footerSave.error;
  const success = heroSave.success || ctaSave.success || footerSave.success;
  const saving = heroSave.saving || ctaSave.saving || footerSave.saving;

  /**
   * Handles adding a new logo with proper dialog and error handling.
   */
  const handleAddLogo = useCallback(async (name: string) => {
    setShowAddLogoDialog(false);
    
    try {
      const res = await adminFetch("/api/admin/home-page/logos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, display_order: data.logos.length }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to add logo (${res.status})`);
      }
      
      const newLogo = await res.json();
      setLogos([...data.logos, newLogo]);
    } catch (err) {
      console.error("Failed to add logo:", err);
      alert(err instanceof Error ? err.message : "Failed to add logo");
    }
  }, [data.logos, setLogos]);

  /**
   * Handles updating a logo with optimistic UI updates.
   */
  const handleUpdateLogo = useCallback(async (id: string, updates: Partial<Logo>) => {
    // Optimistic update
    const previousLogos = data.logos;
    setLogos(data.logos.map((l) => (l.id === id ? { ...l, ...updates } : l)));
    
    try {
      const res = await adminFetch(`/api/admin/home-page/logos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to update logo (${res.status})`);
      }
      
      const updated = await res.json();
      setLogos(data.logos.map((l) => (l.id === id ? updated : l)));
    } catch (err) {
      // Revert on error
      setLogos(previousLogos);
      console.error("Failed to update logo:", err);
      alert(err instanceof Error ? err.message : "Failed to update logo");
    }
  }, [data.logos, setLogos]);

  /**
   * Handles deleting a logo with confirmation dialog.
   */
  const handleDeleteLogo = useCallback(async () => {
    if (!deleteLogoState) return;
    
    const { id, name } = deleteLogoState;
    setDeleteLogoState(null);
    
    try {
      const res = await adminFetch(`/api/admin/home-page/logos/${id}`, {
        method: "DELETE",
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Failed to delete logo (${res.status})`);
      }
      
      setLogos(data.logos.filter((l) => l.id !== id));
    } catch (err) {
      console.error("Failed to delete logo:", err);
      alert(err instanceof Error ? err.message : "Failed to delete logo");
    }
  }, [deleteLogoState, data.logos, setLogos]);


  if (loading) {
    return (
      <div className="swa-card" data-testid="homepage-manager-loading">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="spinner" aria-label="Loading" />
          <span>Loading home page settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }} data-testid="homepage-manager">
      {error && (
        <div className="swa-alert swa-alert--error" role="alert" aria-live="assertive">
          {error}
        </div>
      )}
      {success && (
        <div className="swa-alert swa-alert--success" role="status" aria-live="polite">
          {success}
        </div>
      )}

      {/* Tabs */}
      <div 
        role="tablist" 
        aria-label="Homepage sections"
        style={{ display: "flex", gap: 0, borderBottom: "2px solid var(--color-border)" }}
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`${tab.id}-panel`}
            onClick={() => setActiveTab(tab.id)}
            data-testid={`tab-${tab.id}`}
            style={{
              padding: "12px 24px",
              fontSize: 14,
              fontWeight: 600,
              background: "none",
              border: "none",
              cursor: "pointer",
              borderBottom: activeTab === tab.id ? "2px solid var(--color-primary)" : "2px solid transparent",
              marginBottom: -2,
              color: activeTab === tab.id ? "var(--color-primary)" : "var(--color-text-muted)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              {tab.icon}
            </span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div role="tabpanel" id="hero-panel" aria-labelledby="hero-tab" hidden={activeTab !== "hero"}>
        {activeTab === "hero" && (
          <HeroTab
            settings={data.heroSettings}
            onChange={setHeroSettings}
            onSave={async () => { await heroSave.save(data.heroSettings); }}
            saving={heroSave.saving}
          />
        )}
      </div>

      <div role="tabpanel" id="logos-panel" aria-labelledby="logos-tab" hidden={activeTab !== "logos"}>
        {activeTab === "logos" && (
          <LogosTab
            logos={data.logos}
            onAdd={async () => { setShowAddLogoDialog(true); }}
            onUpdate={handleUpdateLogo}
            onDelete={(id, name) => setDeleteLogoState({ id, name })}
          />
        )}
      </div>

      <div role="tabpanel" id="cta-panel" aria-labelledby="cta-tab" hidden={activeTab !== "cta"}>
        {activeTab === "cta" && (
          <CTATab
            settings={data.ctaSettings}
            onChange={setCTASettings}
            onSave={async () => { await ctaSave.save(data.ctaSettings); }}
            saving={ctaSave.saving}
          />
        )}
      </div>

      <div role="tabpanel" id="footer-panel" aria-labelledby="footer-tab" hidden={activeTab !== "footer"}>
        {activeTab === "footer" && (
          <FooterTab
            settings={data.footerSettings}
            onChange={setFooterSettings}
            onSave={async () => { await footerSave.save(data.footerSettings); }}
            saving={footerSave.saving}
          />
        )}
      </div>

      {/* Dialogs */}
      <InputDialog
        isOpen={showAddLogoDialog}
        title="Add Organisation Logo"
        message="Enter the organisation name:"
        placeholder="Organisation name"
        confirmText="Add Logo"
        cancelText="Cancel"
        onConfirm={handleAddLogo}
        onCancel={() => setShowAddLogoDialog(false)}
      />

      <ConfirmDialog
        isOpen={deleteLogoState !== null}
        title="Delete Logo"
        message={`Are you sure you want to delete "${deleteLogoState?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDeleteLogo}
        onCancel={() => setDeleteLogoState(null)}
      />
    </div>
  );
}
