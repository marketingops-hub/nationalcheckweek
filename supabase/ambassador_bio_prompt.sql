-- Ambassador BIO generator prompt
-- Run in Supabase SQL editor to seed the ambassador bio prompt template.
-- This prompt is used by /api/admin/ambassadors/generate-bio and is editable
-- via the Admin > Prompts section.

INSERT INTO prompt_templates (page_type, section_key, label, prompt, model)
VALUES (
  'ambassador',
  'bio',
  'Ambassador BIO Generator',
  'You are writing a professional ambassador biography for the Schools Wellbeing Australia website.

Ambassador details:
- Name: {{name}}
- Title / Role: {{title}}
- LinkedIn: {{linkedin}}
- Website: {{website}}
- Extra context: {{notes}}

Write a compelling, warm, and professional third-person biography (3–5 paragraphs, ~250–350 words) that:
1. Introduces who they are and their professional background
2. Highlights their passion for student wellbeing and education
3. Describes their relevant expertise and achievements
4. Explains why they are an ambassador for Schools Wellbeing Australia
5. Ends with a forward-looking statement about their goals

Use clear, accessible language suitable for a public-facing education website. Do not use bullet points. Write in flowing paragraphs only.',
  'gpt-4o'
)
ON CONFLICT (page_type, section_key) DO UPDATE
  SET label  = EXCLUDED.label,
      prompt = EXCLUDED.prompt,
      model  = EXCLUDED.model;
