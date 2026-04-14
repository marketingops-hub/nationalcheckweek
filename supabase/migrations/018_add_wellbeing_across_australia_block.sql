-- Add "Wellbeing Across Australia" block to homepage
-- This block showcases wellbeing initiatives and data across different Australian states

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

-- Update comment
COMMENT ON TABLE homepage_blocks IS 'Modular homepage blocks supporting types: hero, stats, features, logos, cta, testimonials, schools_navigating_data, wellbeing_across_australia';
