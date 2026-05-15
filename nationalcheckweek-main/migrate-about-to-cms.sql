-- Migration: Copy hardcoded About page content into CMS
-- This updates the existing cms_pages entry for 'about-us' slug

UPDATE cms_pages
SET content = '[
  {
    "id": "hero_heading",
    "type": "heading",
    "data": {
      "text": "About National Check-In Week",
      "level": 1
    }
  },
  {
    "id": "hero_subtitle",
    "type": "paragraph",
    "data": {
      "text": "Founded with a clear mission: to ensure that no child falls through the gaps — regardless of their background, identity, or location."
    }
  },
  {
    "id": "mission_heading",
    "type": "heading",
    "data": {
      "text": "Australian schools are under pressure — and students are struggling silently",
      "level": 2
    }
  },
  {
    "id": "mission_p1",
    "type": "paragraph",
    "data": {
      "text": "National Check-In Week (NCIW) was founded with a clear mission: to ensure that no child falls through the gaps — regardless of their background, identity, or location. We exist to put real-time wellbeing data in the hands of the people who can act on it: school leaders, counsellors, and teachers."
    }
  },
  {
    "id": "mission_p2",
    "type": "paragraph",
    "data": {
      "text": "Every year, for one dedicated week, schools across Australia pause and ask their students a simple but profound question: How are you, really? The answers shape interventions, policies, and support systems that can change — and save — young lives."
    }
  },
  {
    "id": "stats_heading",
    "type": "heading",
    "data": {
      "text": "Why We Started National Check-In Week",
      "level": 2
    }
  },
  {
    "id": "stat1_heading",
    "type": "heading",
    "data": {
      "text": "1 in 5",
      "level": 3
    }
  },
  {
    "id": "stat1_text",
    "type": "paragraph",
    "data": {
      "text": "children reported feeling more down, scared or worried than they used to (Australian Human Rights Commission)"
    }
  },
  {
    "id": "stat2_heading",
    "type": "heading",
    "data": {
      "text": "53%",
      "level": 3
    }
  },
  {
    "id": "stat2_text",
    "type": "paragraph",
    "data": {
      "text": "of children were negatively affected by the pandemic (RCH National Child Health Poll)"
    }
  },
  {
    "id": "stat3_heading",
    "type": "heading",
    "data": {
      "text": "Highest risk",
      "level": 3
    }
  },
  {
    "id": "stat3_text",
    "type": "paragraph",
    "data": {
      "text": "young Australians still face the worst mental and wellbeing effects of Covid-19 (Prof Nicholas Biddle, The Guardian)"
    }
  },
  {
    "id": "stats_conclusion",
    "type": "paragraph",
    "data": {
      "text": "These aren''t abstract statistics. They represent children in classrooms across Australia who are struggling without the data infrastructure that could identify them early and connect them to support. National Check-In Week exists to change that."
    }
  },
  {
    "id": "pillars_heading",
    "type": "heading",
    "data": {
      "text": "The Pillars of National Check-In Week",
      "level": 2
    }
  },
  {
    "id": "pillar1_heading",
    "type": "heading",
    "data": {
      "text": "🌉 Bridging Gaps",
      "level": 3
    }
  },
  {
    "id": "pillar1_text",
    "type": "paragraph",
    "data": {
      "text": "National Check-In Week addresses critical gaps in student wellbeing assessments. Traditional tools often provide only reactive insights into student wellbeing, leaving silent struggles unchecked. Our initiative offers real-time, actionable triangulated data on school and student wellbeing, enabling early intervention and fostering a preventative approach rather than a reactive one."
    }
  },
  {
    "id": "pillar2_heading",
    "type": "heading",
    "data": {
      "text": "🎙️ Elevating Voices",
      "level": 3
    }
  },
  {
    "id": "pillar2_text",
    "type": "paragraph",
    "data": {
      "text": "At the heart of this initiative is Student Voice. We create a safe space where students can identify, communicate, and learn to self-regulate their emotions. By empowering students to understand and express their feelings, we reduce the stigma surrounding emotional expression. Through daily wellbeing check-ins, students are given the opportunity to voice their experiences, helping to create a more inclusive, connected, and supportive school environment where every student is seen and heard."
    }
  },
  {
    "id": "pillar3_heading",
    "type": "heading",
    "data": {
      "text": "💙 Supporting Student Wellbeing",
      "level": 3
    }
  },
  {
    "id": "pillar3_text",
    "type": "paragraph",
    "data": {
      "text": "National Check-In Week not only raises awareness of the importance of student wellbeing, but also highlights the need for ongoing, effective support and access to resources that foster emotional growth. Through this week, students develop essential skills such as self-regulation, resilience, and emotional awareness — skills crucial for managing stress, building strong relationships, and promoting overall academic success."
    }
  },
  {
    "id": "beliefs_heading",
    "type": "heading",
    "data": {
      "text": "Every student deserves to be seen",
      "level": 2
    }
  },
  {
    "id": "belief1",
    "type": "paragraph",
    "data": {
      "text": "📊 Data without action is noise. Action without data is guesswork."
    }
  },
  {
    "id": "belief2",
    "type": "paragraph",
    "data": {
      "text": "🔒 Student privacy and trust are non-negotiable — always."
    }
  },
  {
    "id": "belief3",
    "type": "paragraph",
    "data": {
      "text": "🌐 Wellbeing disparities are solvable with the right information."
    }
  },
  {
    "id": "belief4",
    "type": "paragraph",
    "data": {
      "text": "🤝 Schools, families, and communities are strongest when working together."
    }
  },
  {
    "id": "cta_heading",
    "type": "heading",
    "data": {
      "text": "Ready to make student wellbeing visible at your school?",
      "level": 2
    }
  },
  {
    "id": "cta_text",
    "type": "paragraph",
    "data": {
      "text": "National Check-In Week is free for schools to participate in. Register your school today and join thousands of educators across Australia who are taking student wellbeing seriously."
    }
  },
  {
    "id": "cta_button1",
    "type": "button",
    "data": {
      "text": "Explore the Issues",
      "url": "/issues"
    }
  },
  {
    "id": "cta_button2",
    "type": "button",
    "data": {
      "text": "Register Your School",
      "url": "https://nationalcheckinweek.com/register"
    }
  }
]'::jsonb,
slug = 'about',
title = 'About us',
meta_title = 'About — National Check-in Week',
meta_description = 'National Check-In Week was founded to ensure no child falls through the gaps — regardless of background, identity, or location. Learn about our mission, pillars, and the data driving this movement.',
published = true
WHERE id = '32e21514-f1f7-4374-a4cc-a64f2aed6077';
