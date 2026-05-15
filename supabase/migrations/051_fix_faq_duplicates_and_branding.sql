-- Fix FAQ duplicates and update branding from Schools Wellbeing Australia to National Check-In Week

-- Delete all old FAQs with Schools Wellbeing Australia branding
DELETE FROM "Faq" WHERE question LIKE '%Schools Wellbeing Australia%';

-- Delete any duplicate FAQs that match the static FAQs in the code
DELETE FROM "Faq" WHERE question IN (
  'What is National Check-In Week (NCIW)?',
  'When is National Check-In Week?',
  'How can I participate in NCIW?',
  'Who can join NCIW?',
  'How do I sign up?',
  'Where does the NCIW data come from?',
  'Do schools get access to Life Skills GO during NCIW?'
);

-- Verification
DO $$
DECLARE
  faq_count INT;
  swa_count INT;
BEGIN
  SELECT COUNT(*) INTO faq_count FROM "Faq" WHERE active = true;
  SELECT COUNT(*) INTO swa_count FROM "Faq" WHERE question LIKE '%Schools Wellbeing Australia%';
  
  RAISE NOTICE 'Active FAQs remaining: %', faq_count;
  
  IF swa_count = 0 THEN
    RAISE NOTICE 'Schools Wellbeing Australia branding removed: OK';
  ELSE
    RAISE WARNING 'Still have % FAQs with old branding', swa_count;
  END IF;
END $$;
