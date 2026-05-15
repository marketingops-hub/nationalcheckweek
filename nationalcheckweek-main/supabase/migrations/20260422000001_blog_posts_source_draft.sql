-- ═══════════════════════════════════════════════════════════════════════════
-- Link blog_posts rows back to their originating content_drafts row.
--
-- Added to support the "Publish to /admin/blog" button on the content-creator
-- draft detail page. When the admin clicks publish, the API route either
-- inserts a new blog_posts row (no link yet) or updates the existing one
-- whose source_draft_id matches — keeps re-publishes idempotent and lets the
-- admin see that a given draft has already been sent to the blog.
--
-- ON DELETE SET NULL means deleting the underlying draft leaves the blog
-- post intact (it may already be public) but clears the dangling reference.
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE blog_posts
  ADD COLUMN IF NOT EXISTS source_draft_id UUID
    REFERENCES content_drafts(id) ON DELETE SET NULL;

-- Unique partial index: at most one blog_posts row per source_draft_id, but
-- rows that aren't linked (source_draft_id IS NULL) are exempt. Prevents
-- an admin from accidentally creating two blog posts from the same draft.
CREATE UNIQUE INDEX IF NOT EXISTS blog_posts_source_draft_id_uniq
  ON blog_posts (source_draft_id)
  WHERE source_draft_id IS NOT NULL;
