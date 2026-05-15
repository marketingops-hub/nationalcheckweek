-- Add 'content' field to Resource table for full content on detail pages
-- Description = short summary for listing page
-- Content = full content for individual resource detail pages

-- Add the content column
ALTER TABLE "Resource" 
ADD COLUMN IF NOT EXISTS "content" TEXT;

-- Add a comment to document the field
COMMENT ON COLUMN "Resource"."content" IS 'Full content displayed on individual resource detail pages (HTML/Markdown supported)';
COMMENT ON COLUMN "Resource"."description" IS 'Short description displayed on resources listing page';

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'Resource'
ORDER BY ordinal_position;
