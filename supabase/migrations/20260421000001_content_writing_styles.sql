-- ═══════════════════════════════════════════════════════════════════════════
-- content_writing_styles — reusable prompt fragments that steer the voice
-- of every AI-generated idea or draft.
--
-- Design decisions:
--
--   * Styles are small, human-editable strings. Admins can create / edit
--     their own on /admin/content-creator/styles. The 6 rows seeded below
--     cover the common editorial registers the user asked for.
--
--   * This table is NOT an audit-heavy entity. We keep created_at /
--     updated_at for convenience but skip a full event log — a style is
--     effectively a prompt config.
--
--   * A style's row is referenced by content_drafts.brief.style_id (a JSON
--     field). We don't add a FK from the JSON because Postgres can't; the
--     edge functions defensively skip missing / inactive styles and fall
--     back to "no style prompt" rather than erroring.
--
--   * is_active flag lets an admin retire a style without deleting it,
--     preserving the prompt history for drafts that were already generated
--     with it. ON DELETE we simply rely on the edge fns' defensive fetch.
--
-- RLS: admin-only. Edge fns use the service role and bypass RLS entirely.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS content_writing_styles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Short display name. Must be unique so the admin UI's dropdown is
  -- unambiguous.
  title       TEXT NOT NULL UNIQUE,

  -- The actual prompt fragment. Prepended to the system message of the
  -- ideas and generate edge functions. 4 000 chars is plenty — most styles
  -- are 1-2 paragraphs.
  prompt      TEXT NOT NULL CHECK (length(prompt) BETWEEN 10 AND 4000),

  -- Free-text note for the admin ("when to use this"). Not sent to the AI.
  description TEXT,

  -- Retired styles stay in the table for historical drafts but are hidden
  -- from the brief-form dropdown.
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,

  -- Dropdown ordering. Lower = earlier. Seeded rows get 10, 20, 30, ...
  -- so the admin can interleave custom styles without renumbering.
  sort_order  INT NOT NULL DEFAULT 0,

  created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fast dropdown query: "active styles, in display order"
CREATE INDEX IF NOT EXISTS idx_content_writing_styles_active
  ON content_writing_styles (is_active, sort_order);

-- Standard updated_at trigger. Mirrors the one on content_drafts /
-- content_topics so behaviour is consistent across the pipeline.
CREATE OR REPLACE FUNCTION set_content_writing_styles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_content_writing_styles_updated_at ON content_writing_styles;
CREATE TRIGGER trg_content_writing_styles_updated_at
  BEFORE UPDATE ON content_writing_styles
  FOR EACH ROW
  EXECUTE FUNCTION set_content_writing_styles_updated_at();

-- ── RLS ───────────────────────────────────────────────────────────────
-- Admin role gate pattern: every app read/write goes through the Next
-- API layer which uses the service role key. We still enable RLS so that
-- the anon / authenticated keys cannot read styles directly.
ALTER TABLE content_writing_styles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_role_all_content_writing_styles"
  ON content_writing_styles;
CREATE POLICY "service_role_all_content_writing_styles"
  ON content_writing_styles
  FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- ── Seed: the 6 styles the product owner asked for ───────────────────
-- Each prompt is written in the second person ("You write …") so it
-- drops cleanly into a system message. Kept short so they compose well
-- with the mission + type-rules prompts the edge fns already assemble.
INSERT INTO content_writing_styles (title, description, prompt, sort_order) VALUES

  ('Storytelling',
   'Narrative-led. Use for case studies, launch posts, founder notes.',
   $$You write in a story-telling voice. Open with a concrete scene, character or moment. Prefer specific details over abstractions. Use short, rhythmic sentences and active verbs. Every factual claim still comes from the VAULT, but wrap the claims inside a narrative arc (setup → tension → resolution). Avoid corporate hedging and bullet-point dumps.$$,
   10),

  ('Educational',
   'Teacher voice. Use when the goal is to explain something clearly.',
   $$You write in an educational voice. Assume the reader is curious but not expert. Define any jargon before using it. Move from simple to complex, one idea per paragraph. Use concrete examples from the VAULT to illustrate. Prefer clarity over cleverness; favour plain English. End with a short "what to do with this" takeaway.$$,
   20),

  ('Personal POV',
   'First-person opinion. Use for reflections, hot takes, LinkedIn posts.',
   $$You write in a first-person, opinionated voice. Use "I" and "we"; share a perspective rather than pretending to be neutral. Open with a personal observation or an opinion that anchors the piece. Cite VAULT facts to back the opinion, not the other way round. Keep paragraphs short and conversational; contractions are fine. Avoid platitudes and LinkedIn-speak.$$,
   30),

  ('Professional',
   'Measured business register. Default for newsletters and announcements.',
   $$You write in a professional, measured voice suitable for senior stakeholders, policy-makers and school leaders. Use precise nouns and verbs; avoid slang and exclamation marks. Structure ideas logically with clear topic sentences. Back every claim with a VAULT citation. Tone is confident and respectful — never salesy, never breathless.$$,
   40),

  ('Provocative',
   'Deliberately sharp. Use for essays meant to start a debate.',
   $$You write in a provocative, argumentative voice. Take a clear position early and defend it. Use strong verbs and short sentences. You may challenge conventional wisdom, but only with VAULT-backed evidence — no rhetorical fluff. Engage opposing views honestly before rebutting them. Avoid insults; aim for sharp, not snide.$$,
   50),

  ('Scientific',
   'Research register. Use for reports, white papers, evidence briefs.',
   $$You write in a scientific, evidence-first voice. Lead with the finding, then the method, then the caveats. Use precise, neutral language and quantify claims when the VAULT allows ("68 % of respondents" rather than "most"). Cite every statistic with its VAULT id. Acknowledge limitations. Avoid adjectives that editorialise ("amazing", "shocking").$$,
   60);

-- End of migration.
