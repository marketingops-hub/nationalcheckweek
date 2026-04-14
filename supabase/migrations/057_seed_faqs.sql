-- Seed the 8 core FAQs that were previously hardcoded in the public FAQ page.
-- These become DB-managed so the admin panel can edit/reorder/deactivate them.
BEGIN;

INSERT INTO "Faq" (question, answer, category, "sortOrder", active)
VALUES
  ('What is National Check-In Week (NCIW)?',
   'NCIW is a free initiative aimed at improving student wellbeing in Australian schools by providing professional learning, webinars, tools, data, and resources to help school leaders assess current wellbeing programs and support student mental health.',
   'General', 1, true),

  ('When is National Check-In Week?',
   'National Check-In Week will be held between 25–29th May 2026, however there are many events you can be involved in leading up to NCIW. Check out the events page for more information.',
   'General', 2, true),

  ('How can I participate in NCIW?',
   'You can participate by registering and attending our online events and joining this crucial discussion with leading experts in wellbeing.',
   'General', 3, true),

  ('Who can join NCIW?',
   'NCIW is free and open to all Australian school leaders, educators, and wellbeing professionals who want to enhance student wellbeing and create a supportive, inclusive school environment.',
   'General', 4, true),

  ('How do I sign up?',
   'Simply sign up for free and gain access to webinars, panels, and resources designed to support your school community.',
   'General', 5, true),

  ('Where does the NCIW data come from?',
   'National Check-In Week utilised the almost 6 million student emotion check-ins recorded through the Life Skills GO platform in 2025 to generate insights on student wellbeing in Australia through student voice. This data will be used to inform discussions around the current gaps within student wellbeing.',
   'Data', 6, true),

  ('Do schools get access to Life Skills GO during NCIW?',
   'Schools also have free two-week access to Life Skills GO for National Check-In Week to run wellbeing assessments through daily emotion check-ins to evaluate their current wellbeing practices and programs.',
   'General', 7, true),

  ('Is there a cost to participate in NCIW?',
   'No, National Check-In Week is completely free for all Australian schools. This includes access to all webinars, professional learning sessions, resources, and the two-week trial of Life Skills GO.',
   'General', 8, true);

COMMIT;
