-- ════════════════════════════════════════════════════════════════════════
-- Performance indexes for common query paths.
--
-- All created CONCURRENTLY so they don't lock the table during creation.
-- Run via: supabase db push  OR  paste into the Supabase SQL editor.
-- ════════════════════════════════════════════════════════════════════════

-- Published blog posts ordered by date (the public /blog listing query)
CREATE INDEX CONCURRENTLY IF NOT EXISTS blog_posts_published_at_idx
  ON blog_posts (published_at DESC)
  WHERE published = true;

-- Look up a blog post by its source draft (approve-review route does this)
CREATE INDEX CONCURRENTLY IF NOT EXISTS blog_posts_source_draft_id_idx
  ON blog_posts (source_draft_id);

-- Content moderation queue: drafts pending review sorted by submission time.
-- A plain B-tree on the extracted text value is efficient for ORDER BY and
-- IS NOT NULL filters; the partial WHERE clause narrows the index to only
-- the rows that are actually in the review queue.
CREATE INDEX CONCURRENTLY IF NOT EXISTS content_drafts_submitted_for_review_idx
  ON content_drafts ((verification->>'submitted_for_review_at'))
  WHERE (verification->>'submitted_for_review_at') IS NOT NULL;
