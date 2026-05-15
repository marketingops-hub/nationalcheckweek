"use client";

/* ═══════════════════════════════════════════════════════════════════════════
 * VerificationPanel — shows the Claude verifier's verdict for the draft.
 *
 * Pulls from `draft.verification` which is populated by the
 * content-creator-verify edge function. Three outcomes:
 *   - no run yet        → instructional empty state
 *   - verified / partial → status badge + supported + flagged claims
 *   - unverified         → same layout, different badge colour
 *
 * Local StatusBadge / Section / ClaimRow helpers are intentionally private
 * to this file — they're only ever used here.
 * ═══════════════════════════════════════════════════════════════════════════ */

import type {
  ContentDraft, FlaggedClaim, SupportedClaim,
} from "@/lib/content-creator/types";

export function VerificationPanel({ draft }: { draft: ContentDraft }) {
  const v = draft.verification ?? {};
  const supported = (v.supported_claims ?? []) as SupportedClaim[];
  const flagged   = (v.flagged_claims   ?? []) as FlaggedClaim[];

  const hasRun =
    draft.status === 'verified' ||
    draft.status === 'rejected' ||
    !!v.status;

  return (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 16 }}>
      <h3 style={{
        fontSize: 14, fontWeight: 700, color: '#1E1040', marginBottom: 10,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>fact_check</span>
        Vault verification
      </h3>

      {!hasRun ? (
        <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>
          Not yet verified. Run Verify once the draft is ready to cross-check
          every factual claim against the Vault.
        </p>
      ) : (
        <>
          <div style={{ marginBottom: 10 }}>
            <StatusBadge status={v.status ?? 'unverified'} />
            {v.confidence && (
              <span style={{ marginLeft: 8, fontSize: 12, color: '#6B7280' }}>
                confidence: {v.confidence}
              </span>
            )}
          </div>
          {v.notes && <p style={{ fontSize: 13, color: '#374151', marginBottom: 12 }}>{v.notes}</p>}

          {supported.length > 0 && (
            <Section title={`✓ Supported (${supported.length})`} color="#047857">
              {supported.map((c, i) => (
                <ClaimRow
                  key={i}
                  claim={c.claim}
                  sub={c.source || c.vault_id}
                  tone="good"
                />
              ))}
            </Section>
          )}

          {flagged.length > 0 && (
            <Section title={`✗ Flagged (${flagged.length})`} color="#B91C1C">
              {flagged.map((c, i) => (
                <ClaimRow
                  key={i}
                  claim={c.claim}
                  sub={c.reason + (c.suggested_fix ? ` — fix: ${c.suggested_fix}` : '')}
                  tone="bad"
                />
              ))}
            </Section>
          )}
        </>
      )}
    </div>
  );
}

/* ─── Private subcomponents ──────────────────────────────────────────────── */

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; color: string }> = {
    verified:           { bg: '#D1FAE5', color: '#047857' },
    partially_verified: { bg: '#FEF3C7', color: '#B45309' },
    unverified:         { bg: '#FEE2E2', color: '#B91C1C' },
  };
  const m = map[status] ?? map.unverified;
  return (
    <span style={{
      background: m.bg, color: m.color, fontSize: 11, fontWeight: 700,
      padding: '3px 8px', borderRadius: 4,
      textTransform: 'uppercase', letterSpacing: 0.5,
    }}>
      {status.replace('_', ' ')}
    </span>
  );
}

function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{
        fontSize: 12, fontWeight: 700, color, marginBottom: 6,
        textTransform: 'uppercase', letterSpacing: 0.5,
      }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>
    </div>
  );
}

function ClaimRow({ claim, sub, tone }: { claim: string; sub: string; tone: 'good' | 'bad' }) {
  return (
    <div style={{
      fontSize: 12,
      padding: '8px 10px',
      background:  tone === 'good' ? '#ECFDF5' : '#FEF2F2',
      borderLeft: `3px solid ${tone === 'good' ? '#10B981' : '#EF4444'}`,
      borderRadius: 4,
    }}>
      <div style={{ color: '#1E1040', marginBottom: 2 }}>{claim}</div>
      <div style={{ color: '#6B7280' }}>{sub}</div>
    </div>
  );
}
