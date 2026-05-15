-- Update About page to use structured JSON format
-- This preserves all styling while making content editable

UPDATE cms_pages
SET content = '{
  "hero": {
    "title": "About National Check-In Week",
    "subtitle": "Founded with a clear mission: to ensure that no child falls through the gaps — regardless of their background, identity, or location."
  },
  "mission": {
    "heading": "Australian schools are under pressure — and students are struggling silently",
    "paragraph1": "National Check-In Week (NCIW) was founded with a clear mission: to ensure that no child falls through the gaps — regardless of their background, identity, or location. We exist to put real-time wellbeing data in the hands of the people who can act on it: school leaders, counsellors, and teachers.",
    "paragraph2": "Every year, for one dedicated week, schools across Australia pause and ask their students a simple but profound question: How are you, really? The answers shape interventions, policies, and support systems that can change — and save — young lives."
  },
  "stats": [
    {
      "id": "stat-1",
      "number": "1 in 5",
      "label": "children reported feeling more down, scared or worried than they used to",
      "source": "Australian Human Rights Commission"
    },
    {
      "id": "stat-2",
      "number": "53%",
      "label": "of children were negatively affected by the pandemic",
      "source": "RCH National Child Health Poll"
    },
    {
      "id": "stat-3",
      "number": "Highest risk",
      "label": "young Australians still face the worst mental and wellbeing effects of Covid-19",
      "source": "Prof Nicholas Biddle, The Guardian"
    }
  ],
  "statsConclusion": "These aren''t abstract statistics. They represent children in classrooms across Australia who are struggling without the data infrastructure that could identify them early and connect them to support. National Check-In Week exists to change that.",
  "pillars": [
    {
      "id": "pillar-1",
      "icon": "🌉",
      "title": "Bridging Gaps",
      "body": "National Check-In Week addresses critical gaps in student wellbeing assessments. Traditional tools often provide only reactive insights into student wellbeing, leaving silent struggles unchecked. Our initiative offers real-time, actionable triangulated data on school and student wellbeing, enabling early intervention and fostering a preventative approach rather than a reactive one."
    },
    {
      "id": "pillar-2",
      "icon": "🎙️",
      "title": "Elevating Voices",
      "body": "At the heart of this initiative is Student Voice. We create a safe space where students can identify, communicate, and learn to self-regulate their emotions. By empowering students to understand and express their feelings, we reduce the stigma surrounding emotional expression. Through daily wellbeing check-ins, students are given the opportunity to voice their experiences, helping to create a more inclusive, connected, and supportive school environment where every student is seen and heard."
    },
    {
      "id": "pillar-3",
      "icon": "💙",
      "title": "Supporting Student Wellbeing",
      "body": "National Check-In Week not only raises awareness of the importance of student wellbeing, but also highlights the need for ongoing, effective support and access to resources that foster emotional growth. Through this week, students develop essential skills such as self-regulation, resilience, and emotional awareness — skills crucial for managing stress, building strong relationships, and promoting overall academic success."
    }
  ],
  "beliefs": {
    "heading": "Every student deserves to be seen",
    "items": [
      {
        "id": "belief-1",
        "icon": "📊",
        "text": "Data without action is noise. Action without data is guesswork."
      },
      {
        "id": "belief-2",
        "icon": "🔒",
        "text": "Student privacy and trust are non-negotiable — always."
      },
      {
        "id": "belief-3",
        "icon": "🌐",
        "text": "Wellbeing disparities are solvable with the right information."
      },
      {
        "id": "belief-4",
        "icon": "🤝",
        "text": "Schools, families, and communities are strongest when working together."
      }
    ]
  },
  "cta": {
    "heading": "Ready to make student wellbeing visible at your school?",
    "text": "National Check-In Week is free for schools to participate in. Register your school today and join thousands of educators across Australia who are taking student wellbeing seriously."
  }
}'::jsonb,
slug = 'about',
title = 'About us',
meta_title = 'About — National Check-in Week',
meta_description = 'National Check-In Week was founded to ensure no child falls through the gaps — regardless of background, identity, or location. Learn about our mission, pillars, and the data driving this movement.',
published = true
WHERE id = '32e21514-f1f7-4374-a4cc-a64f2aed6077';
