-- Add "If Not Now When" homepage block
-- Goes directly after the How to Participate block, sharing the same pink background
-- for a seamless visual section

-- Update How to Participate block to include the pink background color
UPDATE homepage_blocks
SET content = content || '{"backgroundColor": "#E30982"}'::jsonb
WHERE block_type = 'how_to_participate';

-- Insert the If Not Now When block right after How to Participate
INSERT INTO homepage_blocks (block_type, title, content, display_order, is_visible)
VALUES (
  'if_not_now_when',
  'If Not Now, When?',
  '{
    "sectionTitle": "If not now, when?",
    "heading": "Unite for a New Era in Student Wellbeing",
    "description": "Australia is at a critical crossroads. The challenges facing young people are growing in scale, complexity, and consequence, yet many schools still do not have the tools, data, professional learning, and support needed to act early. National Check-In Week 2026 is more than a campaign — it is a national movement to elevate student voice, challenge outdated and fragmented wellbeing approaches, and drive systemic, generational change.",
    "boldNote": "All events, tools and resources are free for every school and family.",
    "subheading": "Why It''s Time to Lead",
    "subDescription": "We''re calling on school leaders, education departments, policymakers, and communities to help shape a stronger national response. Join us to:",
    "checklistItems": [
      "Embed emotional literacy and self-regulation across whole-school communities",
      "Champion evidence-based, data-informed wellbeing strategies",
      "Elevate student voice as a key driver of policy and practice",
      "Give schools real-time, actionable data to continuously measure wellbeing, identify patterns, target interventions, and strengthen prevention",
      "Ensure educators across Australia have access to the education, tools, services, and support they need to meet the growing and increasingly complex needs of students with confidence, consistency, and care"
    ],
    "backgroundColor": "#E30982"
  }'::jsonb,
  (
    SELECT display_order + 1
    FROM homepage_blocks
    WHERE block_type = 'how_to_participate'
    LIMIT 1
  ),
  true
)
ON CONFLICT DO NOTHING;

DO $$
BEGIN
  RAISE NOTICE 'If Not Now When block inserted after How to Participate block.';
END $$;
