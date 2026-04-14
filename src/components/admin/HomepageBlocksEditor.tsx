"use client";

import React, { useState, useEffect, useCallback, memo } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useHomepageBlocks } from "./homepage-builder/hooks/useHomepageBlocks";
import { 
  HeroBlockEditor, 
  StatsBlockEditor, 
  CTABlockEditor,
  WelcomeBlockEditor,
  WhatIsItBlockEditor,
  WhyMattersBlockEditor,
  WhatMakesDifferentBlockEditor,
  WhatAndWhoBlockEditor,
  BePartCTABlockEditor,
  HowToParticipateBlockEditor,
  AmbassadorsBlockEditor,
  HowLifeSkillsGOBlockEditor,
  AmbassadorVoicesBlockEditor,
  PartnersSlideshowBlockEditor,
  IfNotNowWhenBlockEditor,
  YourVoiceBlockEditor
} from "./homepage-builder/block-editors";
import type {
  HomepageBlock,
  BlockType,
  BlockContent,
  HeroBlockContent,
  StatsBlockContent,
  CTABlockContent,
  WelcomeBlockContent,
  WhatIsItBlockContent,
  WhyMattersBlockContent,
  WhatMakesDifferentBlockContent,
  WhatAndWhoBlockContent,
  BePartCTABlockContent,
  HowToParticipateBlockContent,
  AmbassadorsBlockContent,
  HowLifeSkillsGOBlockContent,
  AmbassadorVoicesBlockContent,
  PartnersSlideshowBlockContent,
  IfNotNowWhenBlockContent,
  YourVoiceBlockContent,
} from "@/types/homepage-blocks";

/** Single source of truth for all supported homepage block types. */
const HOMEPAGE_BLOCK_DEFS: Array<{ type: BlockType; label: string; defaultContent: BlockContent }> = [
  { type: "hero",                 label: "Hero",                  defaultContent: { heading: "New Hero Section", subheading: "", primaryCTA: { text: "Get Started", link: "/" }, secondaryCTA: { text: "", link: "" }, backgroundImage: "" } },
  { type: "stats",                label: "Stats",                 defaultContent: { stats: [{ value: "0", label: "Label" }] } },
  { type: "cta",                  label: "CTA",                   defaultContent: { eyebrow: "", heading: "Take Action", description: "", primaryCTA: { text: "Learn More", link: "/" }, secondaryCTA: { text: "", link: "" }, backgroundColor: "#6366f1", textColor: "#ffffff" } },
  { type: "welcome",              label: "Welcome",               defaultContent: { eyebrow: "", heading: "Welcome", description: "", longDescription: "" } },
  { type: "what_is_it",           label: "What Is It",            defaultContent: { vimeoUrl: "", heading: "What Is It?", description: "", ctaText: "Learn More", ctaLink: "/" } },
  { type: "why_matters",          label: "Why It Matters",        defaultContent: { heading: "Why It Matters", subheading: "", cards: [{ icon: "star", title: "Reason 1", description: "" }] } },
  { type: "what_makes_different", label: "What Makes Us Different",defaultContent: { heading: "What Makes Us Different", paragraphs: [""] } },
  { type: "what_and_who",         label: "What & Who",            defaultContent: { column1Heading: "What", column1Description: "", column1Tags: [], column2Heading: "Who", column2Items: [], ctaQuote: "" } },
  { type: "be_part_cta",          label: "Be Part CTA",           defaultContent: { heading: "Be Part Of It", subheading: "", description: "", ctaText: "Join Now", ctaLink: "/" } },
  { type: "how_to_participate",   label: "How To Participate",    defaultContent: { heading: "How To Participate", description: "", features: [] } },
  { type: "ambassadors",          label: "Ambassadors",           defaultContent: { heading: "Our Ambassadors", description: "", ambassadors: [] } },
  { type: "how_lifeskills_go",    label: "How LifeSkills GO",     defaultContent: { heading: "How Life Skills GO Powers This", paragraphs: [""], image: "" } },
  { type: "ambassador_voices",    label: "Ambassador Voices",     defaultContent: { heading: "Ambassador Voices", description: "", buttonText: "Watch Stories" } },
  { type: "partners_slideshow",   label: "Partners Slideshow",    defaultContent: { heading: "Our Partners" } },
  { type: "if_not_now_when",      label: "If Not Now When",       defaultContent: { sectionTitle: "", heading: "If Not Now, When?", description: "", subheading: "", checklistItems: [] } },
  { type: "your_voice",           label: "Your Voice",            defaultContent: { eyebrow: "We Need Your Help", heading: "Let Your Voice Be Heard", description: "At National Check Week, we need your opinion to help us find the best solution. Join the conversation and make a difference in student wellbeing across Australia.", ctaText: "Join the Conversation", ctaLink: "/your-voice" } },
];

/** Derived lookups — built once from HOMEPAGE_BLOCK_DEFS */
const SUPPORTED_BLOCK_TYPES = new Set<BlockType>(HOMEPAGE_BLOCK_DEFS.map(d => d.type));
const BLOCK_DEF_BY_TYPE = new Map(HOMEPAGE_BLOCK_DEFS.map(d => [d.type, d]));

/**
 * Icon mapping for different block types
 */
const BLOCK_ICONS: Record<BlockType, string> = {
  hero: "home",
  stats: "bar_chart",
  features: "grid_view",
  logos: "business",
  cta: "campaign",
  testimonials: "format_quote",
  faq: "help",
  contact: "contact_mail",
  welcome: "waving_hand",
  what_is_it: "play_circle",
  why_matters: "priority_high",
  what_makes_different: "stars",
  what_and_who: "groups",
  be_part_cta: "campaign",
  how_to_participate: "how_to_reg",
  ambassadors: "workspace_premium",
  how_lifeskills_go: "psychology",
  ambassador_voices: "record_voice_over",
  partners_slideshow: "handshake",
  if_not_now_when: "schedule",
  your_voice: "voice_selection",
};

/**
 * Inline accordion block item — editing expands in-place, no modal needed
 */
const HomepageBlockItem = memo(({
  block,
  index,
  onSave,
  onToggleVisibility,
  onDelete,
}: {
  block: HomepageBlock;
  index: number;
  onSave: (block: HomepageBlock) => Promise<void>;
  onToggleVisibility: (id: string, visible: boolean) => void;
  onDelete: (id: string, title: string) => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const [editedContent, setEditedContent] = useState(block.content);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => { setEditedContent(block.content); }, [block.id]);

  const updateContent = useCallback((key: string, value: unknown) => {
    setEditedContent(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    try {
      await onSave({ ...block, content: editedContent });
      setExpanded(false);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Save failed — please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedContent(block.content);
    setSaveError("");
    setExpanded(false);
  };

  return (
    <Draggable draggableId={block.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          style={{
            ...provided.draggableProps.style,
            background: snapshot.isDragging ? "var(--color-bg-subtle)" : "var(--color-card)",
            border: `2px solid ${expanded ? "var(--color-primary)" : snapshot.isDragging ? "var(--color-primary)" : "var(--color-border)"}`,
            borderRadius: 10,
            overflow: "hidden",
            opacity: block.is_visible ? 1 : 0.55,
            transition: snapshot.isDragging ? undefined : "border-color 0.15s ease, opacity 0.2s ease",
          }}
        >
          {/* ── Collapsed header row ── */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px" }}>
            <div
              {...provided.dragHandleProps}
              style={{ cursor: "grab", color: "var(--color-text-muted)", flexShrink: 0 }}
              aria-label="Drag to reorder"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>drag_indicator</span>
            </div>

            <button
              onClick={() => setExpanded(e => !e)}
              style={{ flex: 1, display: "flex", alignItems: "center", gap: 12, background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0, minWidth: 0 }}
              aria-expanded={expanded}
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 20, color: "var(--color-primary)", flexShrink: 0 }}
                aria-hidden="true"
              >
                {BLOCK_ICONS[block.block_type] || "widgets"}
              </span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, color: "var(--color-text-body)" }}>
                  {block.title || block.block_type}
                </div>
                <div style={{ fontSize: 12, color: "var(--color-text-muted)", textTransform: "capitalize" }}>
                  {block.block_type.replace(/_/g, " ")} block
                </div>
              </div>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--color-text-muted)", flexShrink: 0, transition: "transform 0.2s", transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}>
                expand_more
              </span>
            </button>

            <div style={{ display: "flex", gap: 4, alignItems: "center", flexShrink: 0 }}>
              <button
                onClick={() => onToggleVisibility(block.id, block.is_visible)}
                className="swa-icon-btn"
                title={block.is_visible ? "Hide block" : "Show block"}
                aria-label={block.is_visible ? "Hide block" : "Show block"}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  {block.is_visible ? "visibility" : "visibility_off"}
                </span>
              </button>
              <button
                onClick={() => onDelete(block.id, block.title)}
                className="swa-icon-btn"
                style={{ color: "#EF4444" }}
                aria-label="Delete block"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
              </button>
            </div>
          </div>

          {/* ── Inline editor (expanded) ── */}
          {expanded && (
            <div style={{ borderTop: "1px solid var(--color-border)", padding: "20px 20px 16px" }}>
              {block.block_type === "hero"               && <HeroBlockEditor               content={editedContent as HeroBlockContent}               onChange={updateContent} />}
              {block.block_type === "stats"              && <StatsBlockEditor              content={editedContent as StatsBlockContent}              onChange={updateContent} />}
              {block.block_type === "cta"                && <CTABlockEditor                content={editedContent as CTABlockContent}                onChange={updateContent} />}
              {block.block_type === "welcome"            && <WelcomeBlockEditor            content={editedContent as WelcomeBlockContent}            onChange={updateContent} />}
              {block.block_type === "what_is_it"         && <WhatIsItBlockEditor           content={editedContent as WhatIsItBlockContent}           onChange={updateContent} />}
              {block.block_type === "why_matters"        && <WhyMattersBlockEditor         content={editedContent as WhyMattersBlockContent}         onChange={updateContent} />}
              {block.block_type === "what_makes_different" && <WhatMakesDifferentBlockEditor content={editedContent as WhatMakesDifferentBlockContent} onChange={updateContent} />}
              {block.block_type === "what_and_who"       && <WhatAndWhoBlockEditor         content={editedContent as WhatAndWhoBlockContent}         onChange={updateContent} />}
              {block.block_type === "be_part_cta"        && <BePartCTABlockEditor          content={editedContent as BePartCTABlockContent}          onChange={updateContent} />}
              {block.block_type === "how_to_participate" && <HowToParticipateBlockEditor   content={editedContent as HowToParticipateBlockContent}   onChange={updateContent} />}
              {block.block_type === "ambassadors"        && <AmbassadorsBlockEditor        content={editedContent as AmbassadorsBlockContent}        onChange={updateContent} />}
              {block.block_type === "how_lifeskills_go"  && <HowLifeSkillsGOBlockEditor    content={editedContent as HowLifeSkillsGOBlockContent}    onChange={updateContent} />}
              {block.block_type === "ambassador_voices"  && <AmbassadorVoicesBlockEditor   content={editedContent as AmbassadorVoicesBlockContent}   onChange={updateContent} />}
              {block.block_type === "partners_slideshow" && <PartnersSlideshowBlockEditor  content={editedContent as PartnersSlideshowBlockContent}  onChange={updateContent} />}
              {block.block_type === "if_not_now_when"    && <IfNotNowWhenBlockEditor        content={editedContent as IfNotNowWhenBlockContent}        onChange={updateContent} />}
              {block.block_type === "your_voice"         && <YourVoiceBlockEditor           content={editedContent as YourVoiceBlockContent}           onChange={updateContent} />}
              {!SUPPORTED_BLOCK_TYPES.has(block.block_type) && (
                <div style={{ padding: "16px", textAlign: "center", color: "var(--color-text-muted)", fontSize: 13, background: "var(--color-bg-subtle)", borderRadius: 8 }}>
                  No editor available for block type <code style={{ fontFamily: "monospace" }}>{block.block_type}</code>.
                </div>
              )}

              {saveError && (
                <div role="alert" style={{ fontSize: 13, color: "#dc2626", padding: "8px 12px", borderRadius: 6, background: "#fef2f2", border: "1px solid #fca5a5" }}>
                  {saveError}
                </div>
              )}
              <div style={{ display: "flex", gap: 10, paddingTop: 16, marginTop: 4, borderTop: "1px solid var(--color-border)" }}>
                <button onClick={handleSave} disabled={saving} className="swa-btn swa-btn--primary" style={{ minWidth: 120 }}>
                  {saving ? "Saving…" : "Save Changes"}
                </button>
                <button onClick={handleCancel} disabled={saving} className="swa-btn">Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
});

HomepageBlockItem.displayName = "HomepageBlockItem";

/**
 * Main Homepage Blocks Editor Component
 */
export default function HomepageBlocksEditor() {
  const {
    blocks,
    loading,
    error,
    success,
    createBlock,
    updateBlockOrder,
    toggleVisibility,
    saveBlock,
    deleteBlock,
  } = useHomepageBlocks();

  const [showAddPicker, setShowAddPicker] = useState(false);
  const [adding, setAdding] = useState<BlockType | null>(null);

  const handleAddBlock = useCallback(async (type: BlockType) => {
    const def = BLOCK_DEF_BY_TYPE.get(type);
    if (!def) return;
    setAdding(type);
    try {
      await createBlock(type, def.label, def.defaultContent);
      setShowAddPicker(false);
    } finally {
      setAdding(null);
    }
  }, [createBlock]);

  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;

    const items = Array.from(blocks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    updateBlockOrder(items.map((block, index) => ({ ...block, display_order: index + 1 })));
  }, [blocks, updateBlockOrder]);

  if (loading) {
    return (
      <div className="swa-card" style={{ padding: 40, textAlign: "center" }}>
        <div style={{ fontSize: 14, color: "var(--color-text-muted)" }}>
          Loading homepage blocks...
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {error && (
        <div className="swa-alert swa-alert--error" role="alert">
          <strong>Error:</strong> {error}
        </div>
      )}
      {success && (
        <div className="swa-alert swa-alert--success" role="status">
          {success}
        </div>
      )}

      <div className="swa-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Homepage Content Blocks</h2>
            <p style={{ fontSize: 14, color: "var(--color-text-muted)" }}>
              Drag to reorder • Click to edit • Toggle visibility
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={() => setShowAddPicker(p => !p)}
              className="swa-btn swa-btn--primary"
              style={{ display: "flex", alignItems: "center", gap: 6 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
              Add Block
            </button>
            <a 
              href="/" 
              target="_blank"
              rel="noopener noreferrer"
              className="swa-btn"
              style={{ 
                background: "var(--color-card)", 
                border: "1px solid var(--color-border)", 
                color: "var(--color-text-body)", 
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 15 }}>open_in_new</span>
              Preview
            </a>
          </div>
        </div>

        {/* Add Block Picker */}
        {showAddPicker && (
          <div style={{ marginBottom: 16, padding: 16, background: "var(--color-bg-subtle, #f9fafb)", borderRadius: 10, border: "1px solid var(--color-border)" }}>
            <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: "var(--color-text-muted)" }}>Choose a block type to add:</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 8 }}>
              {HOMEPAGE_BLOCK_DEFS.map(({ type, label }) => (
                <button
                  key={type}
                  onClick={() => handleAddBlock(type)}
                  disabled={adding !== null}
                  style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "10px 12px",
                    border: "1px solid var(--color-border)", borderRadius: 8,
                    background: adding === type ? "var(--color-primary)" : "var(--color-card)",
                    color: adding === type ? "#fff" : "var(--color-text-body)",
                    cursor: adding !== null ? "wait" : "pointer", fontSize: 13, fontWeight: 500,
                    transition: "background 0.15s, border-color 0.15s",
                    opacity: adding !== null && adding !== type ? 0.5 : 1,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16, flexShrink: 0 }}>
                    {BLOCK_ICONS[type] ?? "widgets"}
                  </span>
                  {adding === type ? "Adding…" : label}
                </button>
              ))}
            </div>
          </div>
        )}

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="blocks">
            {(provided) => (
              <div 
                {...provided.droppableProps} 
                ref={provided.innerRef} 
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {blocks.map((block, index) => (
                  <HomepageBlockItem
                    key={block.id}
                    block={block}
                    index={index}
                    onSave={saveBlock}
                    onToggleVisibility={toggleVisibility}
                    onDelete={deleteBlock}
                  />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {blocks.length === 0 && (
          <div style={{ padding: 40, textAlign: "center", color: "var(--color-text-muted)" }}>
            <p>No blocks found. Run the database migration to create default blocks.</p>
          </div>
        )}
      </div>

    </div>
  );
}
