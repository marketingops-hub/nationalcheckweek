-- Add new resources to the Resource table
-- Run this in Supabase SQL Editor

INSERT INTO "Resource" (
  "id",
  "name",
  "description",
  "slug",
  "category",
  "url",
  "thumbnailUrl",
  "sortOrder",
  "active",
  "createdAt",
  "updatedAt"
) VALUES
  (
    gen_random_uuid(),
    'Upschool',
    'Educational resources and programs for student wellbeing and mental health support.',
    'upschool',
    'Wellbeing',
    'https://upschool.com.au',
    NULL,
    10,
    true,
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'Together for Humanity',
    'Programs promoting respect, understanding and social cohesion in schools.',
    'together-for-humanity',
    'Social Cohesion',
    'https://togetherforhumanity.org.au',
    NULL,
    20,
    true,
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'Education Services Australia',
    'National education resources and services supporting Australian schools.',
    'education-services-australia',
    'Education',
    'https://www.esa.edu.au',
    NULL,
    30,
    true,
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'School Can''t Australia',
    'Mental health and wellbeing resources for schools across Australia.',
    'school-cant-australia',
    'Mental Health',
    'https://schoolcant.org.au',
    NULL,
    40,
    true,
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'Canvas',
    'Learning management system and educational technology platform.',
    'canvas',
    'Technology',
    'https://www.instructure.com/canvas',
    NULL,
    50,
    true,
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'Headspace',
    'Youth mental health services and support for young Australians.',
    'headspace',
    'Mental Health',
    'https://headspace.org.au',
    NULL,
    60,
    true,
    NOW(),
    NOW()
  ),
  (
    gen_random_uuid(),
    'Life Skills GO',
    'Life skills education and wellbeing programs for Australian schools.',
    'life-skills-go',
    'Wellbeing',
    'https://lifeskillsgo.com.au',
    NULL,
    70,
    true,
    NOW(),
    NOW()
  )
ON CONFLICT (slug) DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "category" = EXCLUDED."category",
  "url" = EXCLUDED."url",
  "sortOrder" = EXCLUDED."sortOrder",
  "active" = EXCLUDED."active",
  "updatedAt" = NOW();

-- Verify the insert
SELECT "id", "name", "slug", "category", "active", "sortOrder" 
FROM "Resource" 
ORDER BY "sortOrder" ASC;
