-- Simple Content History
-- Stores every generated draft from the Quick Content creator.
-- Feedback iterations overwrite the body on the same row.
-- published_post_id is set when the admin approves and saves to blog_posts.

CREATE TABLE IF NOT EXISTS simple_content_history (
  id                uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt            text        NOT NULL,
  title             text        NOT NULL,
  body              text        NOT NULL,
  feedback          text,
  vault_ids         text[]      DEFAULT '{}',
  published_post_id uuid        REFERENCES blog_posts(id) ON DELETE SET NULL,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS simple_content_history_created_at_idx
  ON simple_content_history (created_at DESC);

-- Keep updated_at current on every row update
CREATE OR REPLACE FUNCTION set_simple_content_history_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_simple_content_history_updated_at ON simple_content_history;
CREATE TRIGGER trg_simple_content_history_updated_at
  BEFORE UPDATE ON simple_content_history
  FOR EACH ROW EXECUTE FUNCTION set_simple_content_history_updated_at();
