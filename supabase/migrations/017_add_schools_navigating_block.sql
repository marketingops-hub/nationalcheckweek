-- Add "What Schools Are Navigating — Without Enough Data" block to homepage
-- This block highlights key issues schools face without sufficient data

INSERT INTO homepage_blocks (block_type, title, content, display_order, is_visible) VALUES
(
  'schools_navigating_data',
  'What Schools Are Navigating — Without Enough Data',
  '{
    "heading": "What Schools Are Navigating — Without Enough Data",
    "subheading": "Critical wellbeing issues affecting Australian students that need better data and support",
    "issues": [
      {
        "icon": "psychology",
        "title": "Mental Health",
        "description": "1 in 7 students experience mental health challenges, but many schools lack comprehensive data to identify at-risk students early.",
        "stat": "14%",
        "statLabel": "of students affected"
      },
      {
        "icon": "sentiment_very_dissatisfied",
        "title": "Anxiety & Depression",
        "description": "Rising rates of anxiety and depression among students, with limited tools to track trends and measure intervention effectiveness.",
        "stat": "25%",
        "statLabel": "increase since 2020"
      },
      {
        "icon": "group_off",
        "title": "Social Isolation",
        "description": "Post-pandemic social disconnection continues to impact student wellbeing, but schools struggle to quantify the scope.",
        "stat": "1 in 4",
        "statLabel": "students feel isolated"
      },
      {
        "icon": "school",
        "title": "Academic Pressure",
        "description": "High academic expectations contribute to stress and burnout, yet data on student workload impact remains limited.",
        "stat": "68%",
        "statLabel": "report high stress"
      },
      {
        "icon": "diversity_3",
        "title": "Bullying & Safety",
        "description": "Cyberbullying and school safety concerns require better tracking systems to protect vulnerable students.",
        "stat": "1 in 5",
        "statLabel": "experience bullying"
      },
      {
        "icon": "family_restroom",
        "title": "Family Challenges",
        "description": "Home environment factors affecting student wellbeing often go unreported due to privacy concerns and data gaps.",
        "stat": "30%",
        "statLabel": "face home challenges"
      }
    ],
    "ctaText": "Help Us Fill the Data Gap",
    "ctaLink": "/events",
    "backgroundColor": "#f8f9fa",
    "accentColor": "#5925f4"
  }'::jsonb,
  7,
  true
)
ON CONFLICT DO NOTHING;

-- Add comment
COMMENT ON TABLE homepage_blocks IS 'Modular homepage blocks supporting types: hero, stats, features, logos, cta, testimonials, schools_navigating_data';
