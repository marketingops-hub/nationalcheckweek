/**
 * About Page Editor - Custom editor for About page with structured sections
 * 
 * Provides a user-friendly interface for editing all About page content including:
 * - Hero section (title, subtitle)
 * - Mission statement (heading, paragraphs)
 * - Statistics (3 stats with sources)
 * - Pillars (3 core pillars)
 * - Beliefs (heading + 4 belief items)
 * - Call to Action (heading, text)
 * 
 * Features:
 * - Character counters on all fields
 * - Max length validation
 * - Required field indicators
 * - Reusable FormField components
 * - Custom hook for state management
 * - CSS modules for styling
 * 
 * @module AboutPageEditor
 */

'use client';

import { useEffect } from 'react';
import { useAboutContent } from '@/hooks/cms/useAboutContent';
import FormField from '@/components/admin/shared/FormField';
import type { AboutPageContent } from '@/types/cms/about';
import { ABOUT_PAGE_CONSTRAINTS } from '@/types/cms/about';
import styles from './AboutPageEditor/AboutPageEditor.module.css';

/**
 * Props for AboutPageEditor component
 */
interface Props {
  /** Initial content to populate the editor */
  initialContent: AboutPageContent;
  /** Callback fired when content changes */
  onChange: (content: AboutPageContent) => void;
}

/**
 * AboutPageEditor Component
 * 
 * Structured editor for About page content with validation and character counting.
 * Uses custom hook for state management and reusable FormField components.
 * 
 * @param props - Component props
 * @returns Rendered editor interface
 * 
 * @example
 * ```tsx
 * <AboutPageEditor
 *   initialContent={aboutContent}
 *   onChange={(content) => setContent(content)}
 * />
 * ```
 */
export default function AboutPageEditor({ initialContent, onChange }: Props) {
  const {
    content,
    isDirty,
    updateField,
    updateStat,
    updatePillar,
    updateBeliefItem,
  } = useAboutContent(initialContent);

  // Notify parent of changes
  useEffect(() => {
    onChange(content);
  }, [content, onChange]);

  return (
    <div className={styles.container}>
      {/* Hero Section */}
      <div className="swa-card">
        <h3 className={styles.sectionTitle}>Hero Section</h3>
        <div className={styles.fieldGroup}>
          <FormField
            label="Title"
            value={content.hero.title}
            onChange={(value) => updateField('hero', 'title', value)}
            maxLength={ABOUT_PAGE_CONSTRAINTS.hero.title.maxLength}
            required={ABOUT_PAGE_CONSTRAINTS.hero.title.required}
          />
          <FormField
            label="Subtitle"
            type="textarea"
            value={content.hero.subtitle}
            onChange={(value) => updateField('hero', 'subtitle', value)}
            maxLength={ABOUT_PAGE_CONSTRAINTS.hero.subtitle.maxLength}
            required={ABOUT_PAGE_CONSTRAINTS.hero.subtitle.required}
          />
        </div>
      </div>

      {/* Mission Section */}
      <div className="swa-card">
        <h3 className={styles.sectionTitle}>Mission Statement</h3>
        <div className={styles.fieldGroup}>
          <FormField
            label="Heading"
            value={content.mission.heading}
            onChange={(value) => updateField('mission', 'heading', value)}
            maxLength={ABOUT_PAGE_CONSTRAINTS.mission.heading.maxLength}
            required={ABOUT_PAGE_CONSTRAINTS.mission.heading.required}
          />
          <FormField
            label="Paragraph 1"
            type="textarea"
            rows={4}
            value={content.mission.paragraph1}
            onChange={(value) => updateField('mission', 'paragraph1', value)}
            maxLength={ABOUT_PAGE_CONSTRAINTS.mission.paragraph1.maxLength}
            required={ABOUT_PAGE_CONSTRAINTS.mission.paragraph1.required}
          />
          <FormField
            label="Paragraph 2"
            type="textarea"
            rows={4}
            value={content.mission.paragraph2}
            onChange={(value) => updateField('mission', 'paragraph2', value)}
            maxLength={ABOUT_PAGE_CONSTRAINTS.mission.paragraph2.maxLength}
            required={ABOUT_PAGE_CONSTRAINTS.mission.paragraph2.required}
          />
        </div>
      </div>

      {/* Statistics Section */}
      <div className="swa-card">
        <h3 className={styles.sectionTitle}>Statistics</h3>
        <div className={styles.arrayContainer}>
          {content.stats.map((stat, index) => (
            <div key={stat.id} className={styles.arrayItem}>
              <div className={styles.arrayItemLabel}>
                Statistic {index + 1}
              </div>
              <div className={styles.arrayItemFields}>
                <FormField
                  label="Number"
                  value={stat.number}
                  onChange={(value) => updateStat(stat.id, { number: value })}
                  maxLength={ABOUT_PAGE_CONSTRAINTS.stats.number.maxLength}
                  required={ABOUT_PAGE_CONSTRAINTS.stats.number.required}
                  placeholder="e.g., 1 in 5"
                />
                <FormField
                  label="Label"
                  type="textarea"
                  rows={2}
                  value={stat.label}
                  onChange={(value) => updateStat(stat.id, { label: value })}
                  maxLength={ABOUT_PAGE_CONSTRAINTS.stats.label.maxLength}
                  required={ABOUT_PAGE_CONSTRAINTS.stats.label.required}
                />
                <FormField
                  label="Source"
                  value={stat.source}
                  onChange={(value) => updateStat(stat.id, { source: value })}
                  maxLength={ABOUT_PAGE_CONSTRAINTS.stats.source.maxLength}
                  required={ABOUT_PAGE_CONSTRAINTS.stats.source.required}
                />
              </div>
            </div>
          ))}
          <div>
            <label className="swa-form-label">
              Conclusion Paragraph
              {ABOUT_PAGE_CONSTRAINTS.statsConclusion.required && <span style={{ color: 'var(--color-error)', marginLeft: 4 }}>*</span>}
            </label>
            <textarea
              className="swa-form-textarea"
              rows={3}
              value={content.statsConclusion}
              onChange={(e) => {
                const newContent = { ...content, statsConclusion: e.target.value };
                onChange(newContent);
              }}
              maxLength={ABOUT_PAGE_CONSTRAINTS.statsConclusion.maxLength}
              required={ABOUT_PAGE_CONSTRAINTS.statsConclusion.required}
            />
            <div style={{ fontSize: 12, color: 'var(--color-text-faint)', marginTop: 4 }}>
              {content.statsConclusion.length}/{ABOUT_PAGE_CONSTRAINTS.statsConclusion.maxLength}
            </div>
          </div>
        </div>
      </div>

      {/* Pillars Section */}
      <div className="swa-card">
        <h3 className={styles.sectionTitle}>The Pillars</h3>
        <div className={styles.arrayContainer}>
          {content.pillars.map((pillar, index) => (
            <div key={pillar.id} className={styles.arrayItem}>
              <div className={styles.arrayItemLabel}>
                Pillar {index + 1}
              </div>
              <div className={styles.arrayItemFields}>
                <FormField
                  label="Icon (emoji)"
                  value={pillar.icon}
                  onChange={(value) => updatePillar(pillar.id, { icon: value })}
                  maxLength={ABOUT_PAGE_CONSTRAINTS.pillars.icon.maxLength}
                  required={ABOUT_PAGE_CONSTRAINTS.pillars.icon.required}
                  placeholder="e.g., 🌉"
                />
                <FormField
                  label="Title"
                  value={pillar.title}
                  onChange={(value) => updatePillar(pillar.id, { title: value })}
                  maxLength={ABOUT_PAGE_CONSTRAINTS.pillars.title.maxLength}
                  required={ABOUT_PAGE_CONSTRAINTS.pillars.title.required}
                />
                <FormField
                  label="Description"
                  type="textarea"
                  rows={5}
                  value={pillar.body}
                  onChange={(value) => updatePillar(pillar.id, { body: value })}
                  maxLength={ABOUT_PAGE_CONSTRAINTS.pillars.body.maxLength}
                  required={ABOUT_PAGE_CONSTRAINTS.pillars.body.required}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Beliefs Section */}
      <div className="swa-card">
        <h3 className={styles.sectionTitle}>What We Believe</h3>
        <div className={styles.fieldGroup}>
          <FormField
            label="Heading"
            value={content.beliefs.heading}
            onChange={(value) => updateField('beliefs', 'heading', value)}
            maxLength={ABOUT_PAGE_CONSTRAINTS.beliefs.heading.maxLength}
            required={ABOUT_PAGE_CONSTRAINTS.beliefs.heading.required}
          />
          {content.beliefs.items.map((item, index) => (
            <div key={item.id} className={styles.arrayItem}>
              <div className={styles.beliefItemRow}>
                <div className={styles.beliefIconColumn}>
                  <FormField
                    label="Icon"
                    value={item.icon}
                    onChange={(value) => updateBeliefItem(item.id, { icon: value })}
                    maxLength={ABOUT_PAGE_CONSTRAINTS.beliefs.items.icon.maxLength}
                    required={ABOUT_PAGE_CONSTRAINTS.beliefs.items.icon.required}
                    placeholder="📊"
                  />
                </div>
                <div className={styles.beliefTextColumn}>
                  <FormField
                    label="Text"
                    type="textarea"
                    rows={2}
                    value={item.text}
                    onChange={(value) => updateBeliefItem(item.id, { text: value })}
                    maxLength={ABOUT_PAGE_CONSTRAINTS.beliefs.items.text.maxLength}
                    required={ABOUT_PAGE_CONSTRAINTS.beliefs.items.text.required}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="swa-card">
        <h3 className={styles.sectionTitle}>Call to Action</h3>
        <div className={styles.fieldGroup}>
          <FormField
            label="Heading"
            value={content.cta.heading}
            onChange={(value) => updateField('cta', 'heading', value)}
            maxLength={ABOUT_PAGE_CONSTRAINTS.cta.heading.maxLength}
            required={ABOUT_PAGE_CONSTRAINTS.cta.heading.required}
          />
          <FormField
            label="Text"
            type="textarea"
            rows={3}
            value={content.cta.text}
            onChange={(value) => updateField('cta', 'text', value)}
            maxLength={ABOUT_PAGE_CONSTRAINTS.cta.text.maxLength}
            required={ABOUT_PAGE_CONSTRAINTS.cta.text.required}
          />
        </div>
      </div>
    </div>
  );
}
