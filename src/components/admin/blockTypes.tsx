import React from "react";
import type { BlockType } from "@/components/admin/pageEditorTypes";

export interface BlockTypeMeta {
  type: BlockType;
  label: string;
  icon: React.ReactElement;
  defaults: Record<string, string>;
  color: string;
}

export const BLOCK_TYPES: BlockTypeMeta[] = [
  { type: "heading",   label: "Heading",    color: "#6366f1", defaults: { text: "New Heading", level: "h2" },
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M4 6h16M4 12h10M4 18h6"/></svg> },
  { type: "paragraph", label: "Paragraph",  color: "#64748b", defaults: { text: "Write your content here…" },
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M4 6h16M4 10h16M4 14h10M4 18h8"/></svg> },
  { type: "image",     label: "Image",      color: "#0ea5e9", defaults: { src: "", alt: "", caption: "" },
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg> },
  { type: "cta",       label: "CTA Button", color: "#f59e0b", defaults: { label: "Learn More", href: "/", style: "primary" },
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="2" y="7" width="20" height="10" rx="5"/><path d="M15 12h4M17 10l2 2-2 2"/></svg> },
  { type: "callout",   label: "Callout",    color: "#10b981", defaults: { text: "", style: "info" },
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> },
  { type: "two-col",   label: "2 Columns",  color: "#8b5cf6", defaults: { left: "", right: "" },
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="9" height="16" rx="1"/><rect x="13" y="4" width="9" height="16" rx="1"/></svg> },
  { type: "divider",   label: "Divider",    color: "#94a3b8", defaults: {},
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/></svg> },
  { type: "html",      label: "Raw HTML",   color: "#ef4444", defaults: { html: "" },
    icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg> },
];
