"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminFetch } from "@/lib/adminFetch";
import { BLOCK_TYPES } from "@/components/admin/blockTypes";
import type { Block, BlockType, Page } from "@/components/admin/pageEditorTypes";

function uid() { return Math.random().toString(36).slice(2, 10); }
export function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const JSON_HEADERS = { "Content-Type": "application/json" };

export function usePageEditor(page: Page | null) {
  const router = useRouter();
  const isNew  = !page;

  const [title,       setTitle]       = useState(page?.title        ?? "");
  const [slug,        setSlug]        = useState(page?.slug         ?? "");
  const [description, setDescription] = useState(page?.description  ?? "");
  const [blocks,      setBlocks]      = useState<Block[]>((page?.content as Block[]) ?? []);
  const [status,      setStatus]      = useState(page?.status       ?? "draft");
  const [showInMenu,  setShowInMenu]  = useState(page?.show_in_menu ?? false);
  const [metaTitle,   setMetaTitle]   = useState(page?.meta_title   ?? "");
  const [metaDesc,    setMetaDesc]    = useState(page?.meta_desc    ?? "");
  const [ogImage,     setOgImage]     = useState(page?.og_image     ?? "");
  const [saving,      setSaving]      = useState(false);
  const [deleting,    setDeleting]    = useState(false);
  const [error,       setError]       = useState("");
  const [success,     setSuccess]     = useState("");
  const [isDirty,     setIsDirty]     = useState(false);

  function mark() { setIsDirty(true); }

  function handleTitleChange(v: string) {
    setTitle(v);
    if (isNew) setSlug(slugify(v));
    mark();
  }

  /** Appends or inserts a new block with default data. `insertAt` is 0-based. */
  function addBlock(type: BlockType, insertAt?: number) {
    const def = BLOCK_TYPES.find(b => b.type === type)!;
    const newBlock: Block = { id: uid(), type, data: { ...def.defaults } };
    setBlocks(prev => {
      if (insertAt === undefined || insertAt >= prev.length) return [...prev, newBlock];
      const next = [...prev];
      next.splice(insertAt, 0, newBlock);
      return next;
    });
    mark();
  }

  function updateBlock(id: string, updated: Block) {
    setBlocks(b => b.map(bl => bl.id === id ? updated : bl));
    mark();
  }

  function deleteBlock(id: string) {
    setBlocks(b => b.filter(bl => bl.id !== id));
    mark();
  }

  function reorderBlocks(from: number, to: number) {
    const next = [...blocks];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setBlocks(next);
    mark();
  }

  async function handleSave(publishNow?: boolean) {
    if (!title.trim()) { setError("Title is required."); return; }
    if (!slug.trim())  { setError("Slug is required.");  return; }
    setSaving(true); setError(""); setSuccess("");

    const payload = {
      slug:         slug.trim(),
      title:        title.trim(),
      description:  description.trim(),
      content:      blocks,
      status:       publishNow ? "published" : status,
      show_in_menu: showInMenu,
      meta_title:   metaTitle.trim(),
      meta_desc:    metaDesc.trim(),
      og_image:     ogImage.trim(),
    };

    try {
      if (isNew) {
        const res  = await adminFetch("/api/admin/pages", { method: "POST", headers: JSON_HEADERS, body: JSON.stringify(payload) });
        const data = await res.json();
        router.push(`/admin/cms/pages/${data.id}`);
        router.refresh();
        return;
      }
      await adminFetch(`/api/admin/pages/${page!.id}`, { method: "PUT", headers: JSON_HEADERS, body: JSON.stringify(payload) });
      setSuccess(publishNow ? "✓ Published" : "✓ Saved");
      if (publishNow) setStatus("published");
      setIsDirty(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!page || !confirm(`Delete "${page.title}"? This cannot be undone.`)) return;
    setDeleting(true); setError("");
    try {
      await adminFetch(`/api/admin/pages/${page.id}`, { method: "DELETE" });
      router.push("/admin/cms/pages");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
      setDeleting(false);
    }
  }

  return {
    isNew,
    title,       setTitle:       handleTitleChange,
    slug,        setSlug:        (v: string) => { setSlug(slugify(v)); mark(); },
    description, setDescription: (v: string) => { setDescription(v); mark(); },
    blocks,
    status,      setStatus:      (v: string) => { setStatus(v); mark(); },
    showInMenu,  setShowInMenu:  (v: boolean) => { setShowInMenu(v); mark(); },
    metaTitle,   setMetaTitle:   (v: string) => { setMetaTitle(v); mark(); },
    metaDesc,    setMetaDesc:    (v: string) => { setMetaDesc(v); mark(); },
    ogImage,     setOgImage:     (v: string) => { setOgImage(v); mark(); },
    saving, deleting, error, success, isDirty,
    addBlock, updateBlock, deleteBlock, reorderBlocks,
    handleSave, handleDelete,
  };
}
