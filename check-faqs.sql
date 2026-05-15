-- Check all FAQs in the database
SELECT 
  id,
  question,
  answer,
  sort_order,
  published
FROM faqs
ORDER BY sort_order ASC;
