-- ============================================
-- APPLY BOTH MIGRATIONS AT ONCE
-- Copy this entire file and run in Supabase SQL Editor
-- ============================================

-- MIGRATION 017: Add "Schools Navigating Data" block
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

-- MIGRATION 018: Add "Wellbeing Across Australia" block
INSERT INTO homepage_blocks (block_type, title, content, display_order, is_visible) VALUES
(
  'wellbeing_across_australia',
  'Wellbeing Across Australia',
  '{
    "heading": "Wellbeing Across Australia",
    "subheading": "Discover how states and territories are prioritizing student mental health and wellbeing",
    "states": [
      {
        "name": "New South Wales",
        "code": "NSW",
        "color": "#0B1D35",
        "stats": {
          "schools": "2,200+",
          "students": "1.2M",
          "programs": "45"
        },
        "highlights": [
          "Wellbeing Framework implementation",
          "Mental Health First Aid training",
          "Student voice initiatives"
        ],
        "link": "/states/nsw"
      },
      {
        "name": "Victoria",
        "code": "VIC",
        "color": "#003C71",
        "stats": {
          "schools": "1,500+",
          "students": "950K",
          "programs": "38"
        },
        "highlights": [
          "Respectful Relationships program",
          "Mental health practitioners in schools",
          "Wellbeing hubs"
        ],
        "link": "/states/vic"
      },
      {
        "name": "Queensland",
        "code": "QLD",
        "color": "#7C2529",
        "stats": {
          "schools": "1,200+",
          "students": "780K",
          "programs": "32"
        },
        "highlights": [
          "Every Day Matters initiative",
          "Student wellbeing surveys",
          "Parent engagement programs"
        ],
        "link": "/states/qld"
      },
      {
        "name": "South Australia",
        "code": "SA",
        "color": "#D62828",
        "stats": {
          "schools": "700+",
          "students": "280K",
          "programs": "24"
        },
        "highlights": [
          "Wellbeing and Engagement Collection",
          "Trauma-informed practice",
          "Community partnerships"
        ],
        "link": "/states/sa"
      },
      {
        "name": "Western Australia",
        "code": "WA",
        "color": "#FFB81C",
        "stats": {
          "schools": "800+",
          "students": "350K",
          "programs": "28"
        },
        "highlights": [
          "Be You mental health initiative",
          "Aboriginal wellbeing programs",
          "Regional support networks"
        ],
        "link": "/states/wa"
      },
      {
        "name": "Tasmania",
        "code": "TAS",
        "color": "#006A4E",
        "stats": {
          "schools": "300+",
          "students": "85K",
          "programs": "18"
        },
        "highlights": [
          "Child and Student Wellbeing Strategy",
          "Early intervention programs",
          "Family support services"
        ],
        "link": "/states/tas"
      },
      {
        "name": "Australian Capital Territory",
        "code": "ACT",
        "color": "#FFD100",
        "stats": {
          "schools": "140+",
          "students": "72K",
          "programs": "22"
        },
        "highlights": [
          "Future of Education strategy",
          "Positive Behaviours for Learning",
          "Student wellbeing framework"
        ],
        "link": "/states/act"
      },
      {
        "name": "Northern Territory",
        "code": "NT",
        "color": "#C8102E",
        "stats": {
          "schools": "180+",
          "students": "42K",
          "programs": "16"
        },
        "highlights": [
          "Remote schools wellbeing support",
          "Cultural wellbeing programs",
          "Community engagement"
        ],
        "link": "/states/nt"
      }
    ],
    "ctaText": "Explore Your State",
    "ctaLink": "/states",
    "showMap": true,
    "backgroundColor": "#ffffff",
    "accentColor": "#5925f4"
  }'::jsonb,
  8,
  true
)
ON CONFLICT DO NOTHING;

-- Update table comment
COMMENT ON TABLE homepage_blocks IS 'Modular homepage blocks supporting types: hero, stats, features, logos, cta, testimonials, schools_navigating_data, wellbeing_across_australia';

-- ============================================
-- DONE! After running this:
-- 1. Go to /admin/homepage-builder to verify blocks appear
-- 2. Let me know and I'll switch the homepage to use them
-- ============================================
