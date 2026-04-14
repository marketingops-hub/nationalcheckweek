-- ============================================
-- COMPLETE HOMEPAGE BLOCKS - ALL 8 BLOCKS
-- This adds ALL blocks to your homepage
-- Run this in Supabase SQL Editor
-- ============================================

-- First, clear any existing blocks to avoid duplicates
TRUNCATE homepage_blocks;

-- Insert ALL 8 homepage blocks
INSERT INTO homepage_blocks (block_type, title, content, display_order, is_visible) VALUES
-- BLOCK 1: Hero
(
  'hero',
  'Hero Section',
  '{
    "heading": "Student Wellbeing: A National Priority",
    "subheading": "Join Australia''s leading student wellbeing event — bridging data, experts and schools to create lasting change.",
    "primaryCTA": {"text": "Register Now", "link": "/events"},
    "secondaryCTA": {"text": "Learn More", "link": "/about"},
    "backgroundImage": "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=800",
    "badge": {"emoji": "📅", "text": "25 May 2026 · Australia"}
  }'::jsonb,
  1,
  true
),
-- BLOCK 2: Stats
(
  'stats',
  'Impact Statistics',
  '{
    "stats": [
      {"value": "1,200+", "label": "Schools Participating"},
      {"value": "15M+", "label": "Students Reached"},
      {"value": "500+", "label": "Expert Sessions"},
      {"value": "100%", "label": "Free Resources"}
    ]
  }'::jsonb,
  2,
  true
),
-- BLOCK 3: Features
(
  'features',
  'Why It Matters',
  '{
    "heading": "Why Student Wellbeing Matters",
    "features": [
      {
        "icon": "psychology",
        "title": "Mental Health Crisis",
        "description": "1 in 7 Australian students experience mental health challenges. Early intervention is critical."
      },
      {
        "icon": "groups",
        "title": "Whole-School Approach",
        "description": "Effective wellbeing strategies require engagement from students, staff, and families."
      },
      {
        "icon": "trending_up",
        "title": "Data-Driven Insights",
        "description": "Evidence-based approaches help schools measure impact and improve outcomes."
      }
    ]
  }'::jsonb,
  3,
  true
),
-- BLOCK 4: Logos
(
  'logos',
  'Trusted Partners',
  '{
    "heading": "Trusted by Leading Organizations",
    "logos": [
      {"name": "Department of Education", "url": ""},
      {"name": "Australian Curriculum", "url": ""},
      {"name": "Wellbeing Australia", "url": ""},
      {"name": "Mental Health Foundation", "url": ""}
    ]
  }'::jsonb,
  4,
  true
),
-- BLOCK 5: CTA
(
  'cta',
  'Call to Action',
  '{
    "eyebrow": "Join the Movement",
    "heading": "Ready to Make Student Wellbeing a Priority?",
    "description": "Join 1,200+ schools across Australia in the largest student wellbeing initiative. Register now for National Check-in Week 2026.",
    "primaryCTA": {"text": "Register Your School", "link": "/events"},
    "secondaryCTA": {"text": "Download Resources", "link": "/resources"},
    "backgroundColor": "#0B1D35",
    "textColor": "#FFFFFF"
  }'::jsonb,
  5,
  true
),
-- BLOCK 6: Testimonials
(
  'testimonials',
  'What Schools Say',
  '{
    "heading": "Hear from Participating Schools",
    "testimonials": [
      {
        "quote": "National Check-in Week transformed how we approach student wellbeing. The resources are invaluable.",
        "author": "Sarah Mitchell",
        "role": "Principal, Melbourne High School",
        "avatar": "https://i.pravatar.cc/150?img=1"
      },
      {
        "quote": "The data insights helped us identify at-risk students early and provide targeted support.",
        "author": "James Chen",
        "role": "Wellbeing Coordinator, Sydney Grammar",
        "avatar": "https://i.pravatar.cc/150?img=2"
      }
    ]
  }'::jsonb,
  6,
  true
),
-- BLOCK 7: Schools Navigating Data (NEW)
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
),
-- BLOCK 8: Wellbeing Across Australia (NEW)
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
);

-- ============================================
-- DONE! You now have all 8 blocks:
-- 1. Hero
-- 2. Stats
-- 3. Features
-- 4. Logos
-- 5. CTA
-- 6. Testimonials
-- 7. Schools Navigating Data (NEW)
-- 8. Wellbeing Across Australia (NEW)
-- ============================================
