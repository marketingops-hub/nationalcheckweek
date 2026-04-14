-- Add Ambassadors and How Life Skills GO blocks to homepage

-- 1. Ambassadors Block
INSERT INTO homepage_blocks (block_type, title, content, display_order, is_visible) VALUES
(
  'ambassadors',
  'Ambassadors',
  '{
    "heading": "A national movement driving change in student wellbeing",
    "description": "National Check-In Week is bringing together ambassadors, partners, experts, and organisations, such as those below, with a shared determination to shift the national conversation on student wellbeing. Together, they are raising visibility, strengthening understanding, and driving the collective action needed to create meaningful change for young people across Australia.",
    "ambassadors": [
      {
        "name": "Ambassador Name 1",
        "title": "Role/Organization",
        "image": "",
        "bio": ""
      },
      {
        "name": "Ambassador Name 2",
        "title": "Role/Organization",
        "image": "",
        "bio": ""
      },
      {
        "name": "Ambassador Name 3",
        "title": "Role/Organization",
        "image": "",
        "bio": ""
      },
      {
        "name": "Ambassador Name 4",
        "title": "Role/Organization",
        "image": "",
        "bio": ""
      }
    ]
  }'::jsonb,
  80,
  true
);

-- 2. How Life Skills GO Powers NCIW Block (2 columns: text + image)
INSERT INTO homepage_blocks (block_type, title, content, display_order, is_visible) VALUES
(
  'how_lifeskills_go',
  'How Life Skills GO Powers NCIW',
  '{
    "heading": "How is Life Skills GO Powering NCIW?",
    "paragraphs": [
      "In 2024 alone, Life Skills GO recorded over 4 million student check-ins, offering an unparalleled window into the emotional and mental wellbeing of primary-aged students. This scale of real-time data collection gives Life Skills GO unique authority to speak to the most pressing issues facing today''s students—emotional literacy, online incidents, sense of belonging, and persistent tiredness.",
      "Life Skills GO fills a critical gap in the wellbeing space by focusing on early intervention and prevention. The Life Skills GO platform provides real-time insights that empower educators to respond proactively—not reactively—to wellbeing trends. Whether it''s a spike in anxiety around assessments or a dip in emotional state due to external stressors, Life Skills GO dashboards visualise patterns across classrooms and cohorts, allowing for tailored support before problems escalate.",
      "Moreover, Life Skills GO puts student voice at the centre. Every check-in helps shape a clearer, data-driven understanding of how students are feeling and what they need to thrive. This not only supports academic readiness but also fosters a culture of emotional awareness, inclusion, and resilience—laying the foundation for lifelong wellbeing."
    ],
    "image": ""
  }'::jsonb,
  90,
  true
);
