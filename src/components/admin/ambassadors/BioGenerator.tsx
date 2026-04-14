'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { type Ambassador } from './types';

export default function BioGenerator({
  ambassador,
  onApply,
}: {
  ambassador: Ambassador;
  onApply: (bio: string) => void;
}) {
  const [notes, setNotes] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedBio, setGeneratedBio] = useState('');
  const [genError, setGenError] = useState('');

  const handleGenerate = async () => {
    setGenerating(true); setGenError(''); setGeneratedBio('');
    try {
      const sb = createClient();
      const { data: { session } } = await sb.auth.getSession();
      if (!session?.access_token) { setGenError('Not authenticated.'); return; }

      const res = await fetch('/api/admin/ambassadors/generate-bio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({
          name: ambassador.name,
          title: ambassador.title ?? '',
          linkedinUrl: ambassador.linkedinUrl ?? '',
          websiteUrl: ambassador.websiteUrl ?? '',
          notes,
        }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Generation failed');
      setGeneratedBio(d.bio);
    } catch (err) { setGenError(err instanceof Error ? err.message : 'Generation failed'); }
    finally { setGenerating(false); }
  };

  return (
    <div style={{ marginTop: 20, padding: '16px 20px', background: 'linear-gradient(135deg, rgba(124,58,237,0.06), rgba(79,70,229,0.04))', border: '1px solid var(--color-primary-light)', borderRadius: 'var(--radius-lg)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--color-primary)' }}>auto_awesome</span>
        <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--color-primary)' }}>BIO Generator</span>
        <span style={{ fontSize: 11, color: 'var(--color-text-faint)', marginLeft: 4 }}>AI-powered — prompt editable in Prompts section</span>
      </div>

      <div style={{ marginBottom: 10 }}>
        <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>Extra context (optional)</label>
        <textarea
          className="swa-form-textarea"
          rows={2}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder={`e.g. Focus on ${ambassador.name}'s work in rural schools, mention their 2022 award...`}
          style={{ fontSize: 13 }}
        />
      </div>

      <button
        onClick={handleGenerate}
        disabled={generating}
        className="swa-btn swa-btn--primary"
        style={{ marginBottom: 12, opacity: generating ? 0.7 : 1 }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>{generating ? 'hourglass_empty' : 'auto_awesome'}</span>
        {generating ? 'Generating...' : 'Generate BIO'}
      </button>

      {genError && (
        <div style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, color: 'var(--color-error)', fontSize: 12, marginBottom: 10 }}>
          {genError}
        </div>
      )}

      {generatedBio && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Generated BIO — review before applying</div>
          <div style={{ padding: '12px 14px', background: 'var(--color-card)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 13, color: 'var(--color-text-body)', lineHeight: 1.7, marginBottom: 10, whiteSpace: 'pre-wrap' }}>
            {generatedBio}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => { onApply(generatedBio); setGeneratedBio(''); }}
              className="swa-btn swa-btn--primary"
              style={{ fontSize: 12 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check</span>
              Apply to BIO field
            </button>
            <button
              onClick={() => setGeneratedBio('')}
              className="swa-btn"
              style={{ fontSize: 12, background: 'var(--color-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-body)' }}
            >
              Discard
            </button>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="swa-btn"
              style={{ fontSize: 12, background: 'var(--color-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-body)' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>refresh</span>
              Regenerate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
