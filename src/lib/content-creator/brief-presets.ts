/* ═══════════════════════════════════════════════════════════════════════════
 * Shared preset lists for the content-creator brief form.
 *
 * Both the /new BriefForm and the draft detail's BriefSettingsPanel offer
 * the same options, so they live here. Adding a preset in one place picks
 * it up everywhere.
 *
 * "Custom" is a sentinel value the UI swaps for a free-text input — we
 * keep the underlying stored value as a plain string so nothing else in
 * the pipeline has to care about the distinction.
 * ═══════════════════════════════════════════════════════════════════════════ */

export const CUSTOM = '__custom__' as const;

/** Preset tones — first entry is the implicit default when nothing is
 *  picked. All values are admin-facing strings that also work as prompt
 *  text (the edge fn feeds `brief.tone` straight into the user prompt). */
export const TONE_PRESETS: readonly string[] = [
  'Evidence-based',
  'Warm and empathetic',
  'Direct and punchy',
  'Conversational',
  'Authoritative',
  'Inspiring',
  'Playful',
  'Professional',
] as const;

/** Preset audiences. Mirrors the user's current shortlist — Parents,
 *  General Public, Educators — plus a handful of other common ones we
 *  already see in approved topics. */
export const AUDIENCE_PRESETS: readonly string[] = [
  'Parents',
  'General Public',
  'Educators',
  'School principals',
  'Students',
  'Community leaders',
  'Clinicians',
] as const;

/** True when the stored value is one the preset list recognises. Used by
 *  the form to decide whether to show the preset dropdown or drop back
 *  to a free-text input for a legacy value. */
export function isPreset(value: string, presets: readonly string[]): boolean {
  return presets.includes(value);
}
