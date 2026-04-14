'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { adminFetch } from '@/lib/adminFetch';

interface LogoSettings {
  logo_url: string;
  logo_height: number;
}

export default function SiteSettingsClient() {
  const [settings, setSettings] = useState<LogoSettings>({
    logo_url: '/logo/nciw_no_background-1024x577.png',
    logo_height: 160,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await adminFetch('/api/admin/site-settings');
      const data = await res.json();
      if (data.settings) {
        setSettings({
          logo_url: data.settings.logo_url || '/logo/nciw_no_background-1024x577.png',
          logo_height: data.settings.logo_height || 160,
        });
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('folder', 'logo');

      const res = await adminFetch('/api/admin/upload', {
        method: 'POST',
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      setSettings(prev => ({ ...prev, logo_url: data.url }));
      setSuccess('Logo uploaded successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await adminFetch('/api/admin/site-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');

      setSuccess('Settings saved successfully! Refresh the site to see changes.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 48, color: 'var(--color-text-faint)' }}>
        Loading settings...
      </div>
    );
  }

  return (
    <>
      <div className="swa-page-header">
        <div>
          <h1 className="swa-page-title">Site Settings</h1>
          <p className="swa-page-subtitle">Manage logo, navigation, and general site settings</p>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: 16, padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-md)', color: 'var(--color-error)', fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {error}
          <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: 'var(--color-error)', cursor: 'pointer', fontSize: 16 }}>×</button>
        </div>
      )}

      {success && (
        <div style={{ marginBottom: 16, padding: '12px 16px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 'var(--radius-md)', color: 'var(--color-success)', fontSize: 13, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {success}
          <button onClick={() => setSuccess(null)} style={{ background: 'none', border: 'none', color: 'var(--color-success)', cursor: 'pointer', fontSize: 16 }}>×</button>
        </div>
      )}

      <div className="swa-card">
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: 'var(--color-text-primary)' }}>
          Navigation Logo
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 32 }}>
          {/* Logo Upload */}
          <div>
            <label className="swa-form-label">Logo Image</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ width: '100%', height: 120, borderRadius: 10, overflow: 'hidden', border: '2px solid var(--color-border)', background: '#f9fafb', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12 }}>
                {settings.logo_url ? (
                  <Image 
                    src={settings.logo_url} 
                    alt="Logo preview" 
                    width={200} 
                    height={120} 
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                    unoptimized 
                  />
                ) : (
                  <span style={{ color: 'var(--color-text-faint)', fontSize: 13 }}>No logo</span>
                )}
              </div>

              <input 
                ref={fileRef} 
                type="file" 
                accept="image/*" 
                onChange={handleUpload} 
                style={{ display: 'none' }} 
              />
              
              <button 
                type="button" 
                onClick={() => fileRef.current?.click()} 
                disabled={uploading}
                className="swa-btn" 
                style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-body)' }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
                  {uploading ? 'hourglass_empty' : 'upload'}
                </span>
                {uploading ? 'Uploading...' : 'Upload New Logo'}
              </button>

              <input 
                className="swa-form-input" 
                value={settings.logo_url} 
                onChange={e => setSettings(prev => ({ ...prev, logo_url: e.target.value }))} 
                placeholder="Or paste logo URL..." 
                style={{ fontSize: 12 }}
              />
            </div>
          </div>

          {/* Logo Height Slider */}
          <div>
            <label className="swa-form-label">
              Logo Height: {settings.logo_height}px
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input 
                type="range" 
                min="60" 
                max="180" 
                step="10" 
                value={settings.logo_height}
                onChange={e => setSettings(prev => ({ ...prev, logo_height: parseInt(e.target.value) }))}
                style={{ width: '100%', accentColor: 'var(--color-primary)' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-text-faint)' }}>
                <span>60px (Small)</span>
                <span>120px (Medium)</span>
                <span>180px (Large)</span>
              </div>

              <div style={{ marginTop: 12, padding: 12, background: '#f9fafb', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                <div style={{ fontSize: 11, fontWeight: 600, marginBottom: 8, color: 'var(--color-text-muted)' }}>
                  Preview in Navbar (110px height)
                </div>
                <div style={{ height: 110, background: '#fff', borderRadius: 6, display: 'flex', alignItems: 'center', padding: '0 16px', border: '1px solid #e5e7eb' }}>
                  {settings.logo_url && (
                    <Image 
                      src={settings.logo_url} 
                      alt="Logo preview" 
                      width={Math.round(settings.logo_height * 1.77)}
                      height={settings.logo_height} 
                      style={{ maxHeight: settings.logo_height, width: 'auto', objectFit: 'contain' }} 
                      unoptimized 
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
          <button 
            onClick={handleSave} 
            disabled={saving || uploading}
            className="swa-btn swa-btn--primary" 
            style={{ opacity: saving || uploading ? 0.5 : 1 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>
              {saving ? 'hourglass_empty' : 'save'}
            </span>
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
          
          <button 
            onClick={fetchSettings} 
            className="swa-btn" 
            style={{ background: 'var(--color-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-body)' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 15 }}>refresh</span>
            Reset
          </button>
        </div>
      </div>
    </>
  );
}
