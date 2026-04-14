-- Add National Check-In Week 2026 blocks to homepage

-- 1. Welcome Block
INSERT INTO homepage_blocks (block_type, title, content, display_order, is_visible) VALUES
(
  'welcome',
  'Welcome',
  '{
    "eyebrow": "The Data. The Issues. The Experts.",
    "heading": "Australia''s leading FREE national student wellbeing event bringing together the data, the current issues, and the experts",
    "description": "Join leading neuroscientists, educators, psychologists, and experts in their field for free webinars, events, resources, and the first release of Life Skills Go''s 15 Million Student Check-In Report.",
    "longDescription": "National Check-In Week 2026 brings the current landscape into focus, uniting expert insight, emerging national trends, and powerful student voice data to reveal the realities shaping young people''s lives today. It is a catalyst for deeper understanding, more informed conversation, and stronger action on the issues that can no longer be ignored."
  }'::jsonb,
  10,
  true
);

-- 2. What Is It Block (2 columns: video + text)
INSERT INTO homepage_blocks (block_type, title, content, display_order, is_visible) VALUES
(
  'what_is_it',
  'What is National Check-In Week',
  '{
    "vimeoUrl": "https://player.vimeo.com/video/YOUR_VIDEO_ID",
    "heading": "What is National Check-In Week?",
    "description": "National Check-In Week (NCIW) was founded with a clear mission: to ensure that no child falls through the gaps—regardless of their background, identity, or location. Australian schools are at a critical crossroads, yet many still lack the tools, data, and professional learning needed to act early. National Check-In Week 2026 is more than a campaign—it''s a national movement to elevate student voices, challenge outdated and siloed wellbeing practices, reduce educator administration, and drive systemic, generational change.",
    "ctaText": "Register for upcoming events here!",
    "ctaLink": "/events"
  }'::jsonb,
  20,
  true
);

-- 3. Why This Matters Block (4 cards)
INSERT INTO homepage_blocks (block_type, title, content, display_order, is_visible) VALUES
(
  'why_matters',
  'Why This Matters',
  '{
    "heading": "Why This Matters",
    "subheading": "Australia''s young people are facing challenges many adults never experienced themselves.",
    "cards": [
      {
        "icon": "trending_up",
        "title": "Growing Challenges",
        "description": "Anxiety, depression, loneliness, bullying, cyberbullying, school refusal, disengagement, social media pressures, and screen-related issues are affecting wellbeing, learning, attendance, and long-term outcomes."
      },
      {
        "icon": "insights",
        "title": "Clearer Insight Needed",
        "description": "Schools, families, communities, and decision-makers need clearer insight into what young people are experiencing now and stronger ways to respond."
      },
      {
        "icon": "verified",
        "title": "First-of-its-kind Data",
        "description": "For the first time, Life Skills GO will release its 15 Million Student Check-In Report during National Check-In Week 2026."
      },
      {
        "icon": "groups",
        "title": "Student Voice at the Centre",
        "description": "This landmark release brings student voice to the forefront, offering rare insight into the emerging trends, pressures, behaviours, and wellbeing challenges shaping the lives of young people today."
      }
    ]
  }'::jsonb,
  30,
  true
);

-- 4. What Makes NCIW Different Block
INSERT INTO homepage_blocks (block_type, title, content, display_order, is_visible) VALUES
(
  'what_makes_different',
  'What Makes NCIW Different',
  '{
    "heading": "What Makes NCIW Different",
    "paragraphs": [
      "For the first time, Life Skills GO will release its 15 Million Student Check-In Report during National Check-In Week 2026.",
      "This landmark release brings student voice to the forefront, offering rare insight into the emerging trends, pressures, behaviours, and wellbeing challenges shaping the lives of young people today.",
      "Combined with expert-led events, practical resources, and national discussion, NCIW creates a unique platform for deeper understanding and stronger action."
    ]
  }'::jsonb,
  40,
  true
);

-- 5. What and Who Block (2 columns + CTA quote)
INSERT INTO homepage_blocks (block_type, title, content, display_order, is_visible) VALUES
(
  'what_and_who',
  'What and Who',
  '{
    "column1Heading": "Who You''ll Hear From",
    "column1Description": "Through free webinars, events, and discussions, these voices will help unpack the most urgent issues affecting young people and the collective response needed across schools, families, systems, and communities.",
    "column1Tags": ["Neuroscientists", "Educators", "Psychologists", "Researchers", "Sector Leaders", "Experts"],
    "column2Heading": "What You''ll Access",
    "column2Items": [
      "FREE webinars and live events",
      "FREE Expert-led discussions on current student wellbeing issues",
      "FREE Practical resources for schools and families",
      "Insight into social media, screen use, bullying, mental health, and student engagement",
      "Real-time wellbeing insights and whole-school reporting",
      "The first release of Life Skills Go''s 15 Million Student Check-In Report"
    ],
    "ctaQuote": "\"When you don''t know, you don''t know yet.\nWhen you do know, it''s time to act.\nIf not now, when?\""
  }'::jsonb,
  50,
  true
);

-- 6. Be Part of the National Conversation CTA Block
INSERT INTO homepage_blocks (block_type, title, content, display_order, is_visible) VALUES
(
  'be_part_cta',
  'Be Part of the National Conversation',
  '{
    "heading": "Be Part of the National Conversation",
    "subheading": "The issues are here. The data is emerging. The conversation is shifting.",
    "description": "Join National Check-In Week 2026 as leading voices, current insights, and powerful student data come together to bring the realities facing young people into sharper focus.",
    "ctaText": "View Events",
    "ctaLink": "/events"
  }'::jsonb,
  60,
  true
);

-- 7. How to Participate Block (2 columns: text + form)
INSERT INTO homepage_blocks (block_type, title, content, display_order, is_visible) VALUES
(
  'how_to_participate',
  'How to Participate',
  '{
    "heading": "How to Participate",
    "description": "Register via the form on the right to access FREE webinars, professional development sessions, panels, tools, and teaching resources. As part of your participation, your school can receive two weeks of access to Life Skills GO, the platform that powers National Check-In Week. This includes:",
    "features": [
      "Emotion Check-in Feature for students to express how they feel",
      "Wellbeing Data & Reporting: Insights and learner profiles for individual students",
      "Teacher Dashboards: Wellbeing data, reporting, and insights to support teachers",
      "Administrator Dashboards: Comprehensive reporting and insights for school leaders",
      "Interactive Digital Wellbeing Journal: A tool for all students to track their emotional journey",
      "Quiet Place – Self-regulation Center: A space for students to manage their emotions and practice self-regulation",
      "Adaptive Self-Regulation Activities: Evidence-based, trauma-informed activities designed for both students and classrooms",
      "45 Emotion Cards Lessons: A structured program to help students learn about emotions",
      "Printable Resources & Videos: Includes self-regulation and cognitive behavioural therapy (CBT) videos, plus various printable resources",
      "8 Digital Lessons: Curriculum-aligned, evidence-based lessons on identifying, communicating, and managing emotions"
    ],
    "formHeading": "Register Your School"
  }'::jsonb,
  70,
  true
);
