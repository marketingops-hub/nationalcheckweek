-- Insert comprehensive partner data for National Check-in Week
-- This migration adds all partner organizations with full descriptions

-- Clear existing partners (optional - remove if you want to keep existing data)
-- TRUNCATE TABLE "Partner" CASCADE;

-- Insert all partners
INSERT INTO "Partner" (name, description, url, slug, "sortOrder", active, "logoUrl") VALUES

-- Littlescribe
('Littlescribe', 
'Littlescribe transforms handwritten illustrated work into digital books and hard copy books. Littlescribe creates purpose for a child''s writing and provides the ability for children to read and reflect on their own work. Literacy is the bedrock of education and Littlescribe connects key writing skills and literacy skills in a meaningful and engaging way.

Digital books are added to the Megabonkeramus Library, Littlescribe''s very own online library of books by children for children. Children''s books can be kept private and accessible to only them and their families, or available in a library for their class, school, or for all other children to read in the Megabonkeramus Library.

Students are also able to share their work with their family and friends, and create their very own online book clubs to enjoy each other''s work in a safe and secure environment.

Littlescribe allows students and teachers to print physical copies of their books for use in the classroom, to take home to their families, and to share with their loved ones to establish a sense of pride and achievement in learning.',
'https://littlescribe.com', 'littlescribe', 1, true, null),

-- School Can't Australia
('School Can''t Australia',
'Chronic stress is identified by School Can''t Australia as a major contributor to poor mental health and school attendance difficulties experienced by young people. It is crucial to regularly check in with children and young people about the things they find persistently difficult or that leave them feeling unsafe or stressed. Barriers to communicating distress, prevent students from accessing relief, leaving their problems unidentified and unaddressed. Together, we can protect mental health and maintain capacity for learning by removing communication barriers, so we can CHECK-IN, IDENTIFY STRESSORS and REDUCE STRESS.',
'https://schoolcant.com.au', 'school-cant-australia', 2, true, null),

-- Upschool.co
('Upschool.co',
'Founded by educators Gavin McCormack, Dr Kate Ellen, and Richard Mills, Upschool was created to empower children to make a real difference in the world. What began as a bold idea to reimagine education has grown into a global movement, reaching students in over 180 countries with purpose-driven, real-world learning.

We exist so that everyone will have access to a quality education that inspires them to realise their potential to improve the world.

Explore the free Upschool online resources and courses suite to find digital courses for students and educators.

Included are free one week to 10 week courses on a range of topics from The Power of Positive Self-Talk for Students, Importance of Sleep and Values for a Better Tomorrow exploring empathy, teamwork and friendship in your school community.',
'https://upschool.co', 'upschool', 3, true, null),

-- Canvas Instructure
('Canvas Instructure',
'Provide equitable access and instructional continuity. For every student. Everywhere. Every day. Canvas LMS is the robust digital foundation for all aspects of learning.

Simplify teaching and learning activities, organise coursework and keep teachers, students, and families connected and communicating. Anytime, anywhere.',
'https://www.instructure.com/canvas', 'canvas-instructure', 4, true, null),

-- Amazon Web Services
('Amazon Web Services',
'Since launching in 2006, Amazon Web Services has been providing world-leading cloud technologies that help any organization and any individual build solutions to transform industries, communities, and lives for the better.',
'https://aws.amazon.com', 'amazon-web-services', 5, true, null),

-- Together for Humanity
('Together for Humanity',
'National Check-In week is a good reminder for schools to be considering tools, strategies and initiatives that enhance student and staff wellbeing. I think it''s a great way to learn about what strategies are effectively working in schools and an opportunity to talk openly and honestly about the challenges.

Together for Humanity works in the diversity and inclusion space. We know that the research tells us that a good sense of belonging is so important for student wellbeing and mental health. Our programs help students and teachers consider ways to foster belonging and inclusion through understanding difference and responding to harms that threaten a sense of belonging like racism and prejudice.',
'https://togetherforhumanity.org.au', 'together-for-humanity', 6, true, null),

-- Peak Care QLD
('Peak Care QLD',
'Staying true to the original intentions of providing an independent and impartial voice able to represent and promote matters of interest to the non-government sector, PeakCare remains a not-for-profit organisation with a Membership base consisting of non-government organisations involved in the delivery of child protection, out-of-home care and related services. A network of Associate Members made up of individuals and other entities with an interest in child protection also subscribe to PeakCare.

In keeping with our Constitution, the strategic directions and governance of PeakCare is guided and monitored by a Board comprised of elected representatives from our Member organisations.',
'https://peakcare.org.au', 'peak-care-qld', 7, true, null),

-- Black Dog Institute
('Black Dog Institute',
'Black Dog Institute is a proudly independent not-for-profit globally renowned mental health research institute connected to UNSW Sydney. We are the only medical research institute in Australia that investigates mental health across the lifespan—from childhood to adulthood.

We believe in creating hope for those experiencing mental illness by improving mental health outcomes for all Australians.',
'https://www.blackdoginstitute.org.au', 'black-dog-institute', 8, true, null),

-- Education Services Australia
('Education Services Australia',
'Education Services Australia is an education technology company owned by the state, territory and Australian Government education ministers. The company supports national education reform projects and provides cost efficient products and services that can be adapted in response to emerging technologies and the changing needs of the education and training sector.',
'https://www.esa.edu.au', 'education-services-australia', 9, true, null),

-- ACSSO
('ACSSO – Australian Council of State School Organisations',
'As the Australian Council of State School Organisations (ACSSO), we are the voice that speaks on behalf of the interests of the families and communities of more than 2.53 million children attending government schools in Australia.

We are one of the oldest continuously operating parent organisations in Australia and possibly the world. We were formed in 1947 to bring together various state and territory and small parent groups, as well as individual families to develop national policies reflecting the way families wanted public education to be offered for their children.',
'https://www.acsso.org.au', 'acsso', 10, true, null),

-- Sentral
('Sentral',
'Sentral supports student wellbeing by offering a platform for schools to track, manage, and monitor student behavior, enabling proactive interventions and fostering a supportive learning environment. By providing tools for creating individual wellbeing plans and collecting data, Sentral empowers leadership teams to make informed decisions. At Sentral we see NCIW as a chance for educators and the community to prioritise wellbeing in supporting young people''s development.

Sentral is Australia''s leading cloud-based school management platform trusted by more than 2,500 Schools. With its web-based suite of modules, Sentral provides a single comprehensive interface for the management, tracking and reporting of data for school administration, online learning and student management. Sentral supports National Check-in Week through its integration with the platform powering the event, Life Skills GO, to reduce teacher workloads and allow check-ins to be conducted simultaneously with class roll calls.',
'https://www.sentral.com.au', 'sentral', 11, true, null),

-- Life Skills GO
('Life Skills GO',
'Life Skills GO, designed in collaboration with educators, is an easy-to-use emotion and wellbeing data collection tool that measures student readiness to learn, supported with a comprehensive library of evidence-based and curriculum-aligned resources.',
'https://www.lifeskillsgo.com', 'life-skills-go', 12, true, null)

ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  url = EXCLUDED.url,
  "sortOrder" = EXCLUDED."sortOrder",
  active = EXCLUDED.active,
  "updatedAt" = NOW();

-- Verify insertion
DO $$
DECLARE
  partner_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO partner_count FROM "Partner" WHERE active = true;
  RAISE NOTICE 'Partner table now has % active partners', partner_count;
END $$;
