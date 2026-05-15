"use client";

import { useEffect, useState } from "react";
import { FormField, TextInput, TextArea, Button, Alert } from "@/components/shared/forms";
import { useFormState, useValidation } from "@/hooks/shared";
import { z } from "zod";

const yourVoiceSchema = z.object({
  badge_text: z.string().max(50, 'Badge text too long'),
  badge_emoji: z.string().max(10, 'Emoji too long'),
  hero_icon: z.string().max(10, 'Icon too long'),
  hero_title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  hero_subtitle: z.string().min(1, 'Subtitle is required').max(300, 'Subtitle too long'),
  intro_paragraph_1: z.string().min(1, 'First paragraph is required').max(1000, 'Paragraph too long'),
  intro_paragraph_2: z.string().min(1, 'Second paragraph is required').max(1000, 'Paragraph too long'),
  form_id: z.string().min(1, 'Form ID is required').max(200, 'Form ID too long'),
  portal_id: z.string().min(1, 'Portal ID is required').max(50, 'Portal ID too long'),
  region: z.string().min(1, 'Region is required').max(10, 'Region too long'),
});

type YourVoiceData = z.infer<typeof yourVoiceSchema>;

const DEFAULTS: YourVoiceData = {
  badge_text: 'Have Your Say',
  badge_emoji: '🎤',
  hero_icon: '🗣️',
  hero_title: 'Your voice matters',
  hero_subtitle: 'We are inviting educators, parents and carers to share what they are seeing in the lives of children and young people today.',
  intro_paragraph_1: 'Your perspective is valuable. Your insight is important. What you share can help shape a stronger response for young people across Australia.',
  intro_paragraph_2: 'The conversation below takes just a few minutes and your responses are completely confidential. Every submission is reviewed by our team and contributes directly to the evidence base behind National Check-in Week.',
  form_id: '2o-7kx1iFS1a1MP8QeaF-Gg',
  portal_id: '4596264',
  region: 'ap1',
};

export default function AdminYourVoicePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [original, setOriginal] = useState<YourVoiceData>(DEFAULTS);

  const { formData, handleChange, resetForm, setFormData } = useFormState<YourVoiceData>(DEFAULTS);
  const { errors: validationErrors, validateForm, clearError } = useValidation(yourVoiceSchema);

  useEffect(() => {
    fetch("/api/admin/your-voice")
      .then(r => r.json())
      .then((data: YourVoiceData) => {
        setFormData(data);
        setOriginal(data);
      })
      .catch(() => setError("Could not load Your Voice page settings."))
      .finally(() => setLoading(false));
  }, [setFormData]);

  const isDirty = JSON.stringify(formData) !== JSON.stringify(original);

  async function handleSave() {
    if (!validateForm(formData)) {
      setError("Please fix validation errors before saving.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/your-voice", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setOriginal(formData);
      setSuccess("Your Voice page saved successfully.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function handleDiscard() {
    setFormData(original);
    setSuccess("");
    setError("");
  }

  function handleResetToDefaults() {
    setFormData(DEFAULTS);
    setSuccess("");
    setError("");
  }

  return (
    <div>
      <div className="swa-page-header">
        <div>
          <h1 className="swa-page-title">Your Voice Page</h1>
          <p className="swa-page-subtitle">
            Edit the content on the{" "}
            <a href="/your-voice" target="_blank" rel="noopener noreferrer"
              style={{ color: "var(--admin-accent)" }}>/your-voice ↗</a> page
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <a href="/your-voice" target="_blank" rel="noopener noreferrer"
            className="swa-btn swa-btn--ghost" style={{ textDecoration: "none" }}>
            Preview page ↗
          </a>
          {isDirty && (
            <Button onClick={handleSave} disabled={saving} variant="primary">
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          )}
        </div>
      </div>

      {error && <Alert variant="error" message={error} />}
      {success && <Alert variant="success" message={success} />}

      {loading ? (
        <div style={{ color: "var(--admin-text-faint)", padding: 24 }}>Loading…</div>
      ) : (
        <div style={{ display: "grid", gap: 24 }}>

          {/* Hero Section */}
          <div className="swa-card">
            <h2 style={{ fontWeight: 700, fontSize: 16, marginBottom: 20, color: "var(--admin-text-primary)" }}>
              Hero Section
            </h2>

            <div style={{ display: "grid", gap: 20 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                <FormField label="Badge Text" error={validationErrors.badge_text}>
                  <TextInput
                    name="badge_text"
                    value={formData.badge_text}
                    onChange={(e) => { handleChange(e); clearError('badge_text'); }}
                    error={!!validationErrors.badge_text}
                    placeholder="Have Your Say"
                  />
                </FormField>

                <FormField label="Badge Emoji" error={validationErrors.badge_emoji}>
                  <TextInput
                    name="badge_emoji"
                    value={formData.badge_emoji}
                    onChange={(e) => { handleChange(e); clearError('badge_emoji'); }}
                    error={!!validationErrors.badge_emoji}
                    placeholder="🎤"
                  />
                </FormField>

                <FormField label="Hero Icon" error={validationErrors.hero_icon}>
                  <TextInput
                    name="hero_icon"
                    value={formData.hero_icon}
                    onChange={(e) => { handleChange(e); clearError('hero_icon'); }}
                    error={!!validationErrors.hero_icon}
                    placeholder="🗣️"
                  />
                </FormField>
              </div>

              <FormField label="Hero Title" required error={validationErrors.hero_title}>
                <TextInput
                  name="hero_title"
                  value={formData.hero_title}
                  onChange={(e) => { handleChange(e); clearError('hero_title'); }}
                  error={!!validationErrors.hero_title}
                  placeholder="Your voice matters"
                />
              </FormField>

              <FormField label="Hero Subtitle" required error={validationErrors.hero_subtitle}>
                <TextArea
                  name="hero_subtitle"
                  value={formData.hero_subtitle}
                  onChange={(e) => { handleChange(e); clearError('hero_subtitle'); }}
                  error={!!validationErrors.hero_subtitle}
                  placeholder="We are inviting educators, parents and carers..."
                  rows={3}
                />
              </FormField>
            </div>
          </div>

          {/* Intro Section */}
          <div className="swa-card">
            <h2 style={{ fontWeight: 700, fontSize: 16, marginBottom: 20, color: "var(--admin-text-primary)" }}>
              Introduction Text
            </h2>

            <div style={{ display: "grid", gap: 20 }}>
              <FormField label="First Paragraph" required error={validationErrors.intro_paragraph_1}>
                <TextArea
                  name="intro_paragraph_1"
                  value={formData.intro_paragraph_1}
                  onChange={(e) => { handleChange(e); clearError('intro_paragraph_1'); }}
                  error={!!validationErrors.intro_paragraph_1}
                  placeholder="Your perspective is valuable..."
                  rows={3}
                />
              </FormField>

              <FormField label="Second Paragraph" required error={validationErrors.intro_paragraph_2}>
                <TextArea
                  name="intro_paragraph_2"
                  value={formData.intro_paragraph_2}
                  onChange={(e) => { handleChange(e); clearError('intro_paragraph_2'); }}
                  error={!!validationErrors.intro_paragraph_2}
                  placeholder="The conversation below takes just a few minutes..."
                  rows={3}
                />
              </FormField>
            </div>
          </div>

          {/* Form Embed Section */}
          <div className="swa-card">
            <h2 style={{ fontWeight: 700, fontSize: 16, marginBottom: 20, color: "var(--admin-text-primary)" }}>
              HubSpot Form Settings
            </h2>

            <div style={{ display: "grid", gap: 20 }}>
              <FormField 
                label="Form ID" 
                required 
                error={validationErrors.form_id}
                helperText="HubSpot form ID (e.g., 2o-7kx1iFS1a1MP8QeaF-Gg)"
              >
                <TextInput
                  name="form_id"
                  value={formData.form_id}
                  onChange={(e) => { handleChange(e); clearError('form_id'); }}
                  error={!!validationErrors.form_id}
                  placeholder="2o-7kx1iFS1a1MP8QeaF-Gg"
                />
              </FormField>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <FormField 
                  label="Portal ID" 
                  required 
                  error={validationErrors.portal_id}
                  helperText="HubSpot portal/account ID"
                >
                  <TextInput
                    name="portal_id"
                    value={formData.portal_id}
                    onChange={(e) => { handleChange(e); clearError('portal_id'); }}
                    error={!!validationErrors.portal_id}
                    placeholder="4596264"
                  />
                </FormField>

                <FormField 
                  label="Region" 
                  required 
                  error={validationErrors.region}
                  helperText="HubSpot region (e.g., ap1, na1)"
                >
                  <TextInput
                    name="region"
                    value={formData.region}
                    onChange={(e) => { handleChange(e); clearError('region'); }}
                    error={!!validationErrors.region}
                    placeholder="ap1"
                  />
                </FormField>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 12, paddingBottom: 40 }}>
            {isDirty && (
              <Button onClick={handleSave} disabled={saving} variant="primary">
                {saving ? "Saving…" : "Save Changes"}
              </Button>
            )}
            {isDirty && (
              <Button onClick={handleDiscard} variant="secondary">
                Discard Changes
              </Button>
            )}
            <Button onClick={handleResetToDefaults} variant="ghost">
              Reset to Defaults
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
