-- Migration: Seed issues table from hardcoded data
-- This moves src/lib/issues.ts data into the database

INSERT INTO issues (rank, slug, icon, severity, title, anchor_stat, short_desc, definition, australian_data, mechanisms, impacts, groups, sources) VALUES
(1, 'anxiety-depression', '😰', 'critical',
 'Anxiety & Depression in School-Aged Children',
 '13.9% of children aged 4–17 have a mental disorder; anxiety is the most common',
 'Anxiety and depression are the leading mental health challenges in Australian schools, affecting hundreds of thousands of children and disrupting learning at its foundations.',
 'Anxiety disorders include generalised anxiety, social anxiety, separation anxiety and phobias. Major depressive disorder involves persistent sadness, withdrawal, and loss of motivation. Both profoundly impair a child''s ability to learn, form relationships, and develop.',
 'The Young Minds Matter national survey (2013–14) found 13.9% of children aged 4–17 had a mental disorder in the past 12 months, with anxiety disorders the most prevalent. AIHW corroborates this, and the Youth Self-Harm Atlas separately maps depression and anxiety disorders among 12–17 year olds at the PHN and SA3 level, showing significant regional variation across Australia.',
 'Anxiety activates the brain''s threat-detection systems, crowding out the prefrontal cortex activity required for concentration, memory encoding, and reasoning. A child in chronic anxiety cannot easily absorb new information, retain lessons, or participate in classroom discussion. Depression compounds this through fatigue, anhedonia, and social withdrawal.',
 '[{"title":"Attendance","text":"Anxiety is the primary driver of school refusal — children avoid the environments that trigger their distress."},{"title":"Working Memory","text":"Worry consumes cognitive resources needed for learning, reducing effective working memory capacity."},{"title":"Social Development","text":"Withdrawal from peers stunts social skills and creates loneliness feedback loops."},{"title":"Academic Outcomes","text":"Untreated anxiety correlates with lower NAPLAN scores and reduced Year 12 completion rates."}]'::jsonb,
 '["Aboriginal & Torres Strait Islander youth","Girls aged 12–17","Outer regional & remote students","Students with learning difficulties","LGBTQ+ young people"]'::jsonb,
 '["Young Minds Matter National Survey (2013–14)","AIHW Child & Youth Mental Health","AIHW Youth Self-Harm Atlas — depression/anxiety risk factor layer"]'::jsonb),

(2, 'self-harm-suicidality', '🆘', 'critical',
 'Self-Harm & Suicidality',
 'AIHW Youth Self-Harm Atlas maps regional estimates at PHN and SA3 level nationally',
 'Youth self-harm and suicidal ideation are among the most serious indicators in Australian schools. Regional disparities are stark, with remote and Indigenous communities most at risk.',
 'Self-harm refers to deliberate injury to one''s body, often as a coping mechanism for emotional pain. Suicidality encompasses suicidal ideation, plans, and attempts. Both are medical emergencies and significant signals of underlying mental health crisis.',
 'The AIHW Youth Self-Harm Atlas provides regional estimates of youth self-harm and suicidality at PHN, SA4, and SA3 levels using percentile banding. Northern Territory and several Western Australian regional areas consistently appear in the highest percentile bands. The Atlas also maps the co-occurrence of self-harm with depression and anxiety disorders across the same regions.',
 'Self-harm often functions as emotional regulation in the absence of other coping skills. Suicidality emerges from a combination of psychological pain, hopelessness, and perceived burdensomeness. School environments can be protective (belonging, trusted adults) or risk-amplifying (bullying, shame, academic failure).',
 '[{"title":"Attendance & Withdrawal","text":"Episodes often precipitate prolonged absence and social withdrawal from school community."},{"title":"Classroom Safety","text":"Schools must balance duty of care, disclosure requirements, and non-stigmatising response."},{"title":"Peer Impact","text":"Disclosure to peers can create anxiety and secondary trauma in classmates."},{"title":"Long-term Trajectory","text":"Early self-harm is a predictor of adult mental health burden without appropriate intervention."}]'::jsonb,
 '["Remote and very remote youth","Aboriginal & Torres Strait Islander youth","Young people in out-of-home care","LGBTQ+ youth","Teens with co-occurring depression/anxiety"]'::jsonb,
 '["AIHW Youth Self-Harm Atlas — regional PHN/SA3/SA4 data","AIHW Suicide & Self-Harm Monitoring","National Suicide Prevention Adviser reports"]'::jsonb),

(3, 'distress-loneliness', '💔', 'critical',
 'Psychological Distress & Loneliness in Teens',
 '1 in 5 Australian youth report high psychological distress; 1 in 5 feel lonely most or all of the time',
 'Loneliness and psychological distress have emerged as interconnected epidemics among Australian teenagers, accelerated by the COVID-19 pandemic and social media disruption.',
 'Psychological distress refers to emotional suffering characterised by anxiety and depression symptoms. Loneliness is the subjective feeling of disconnection from others — distinct from social isolation. Both are powerful predictors of long-term mental health outcomes.',
 'Mission Australia Youth Survey 2024 found one in five young Australians reported high or very high levels of psychological distress, and one in five felt lonely most or all of the time. Barriers to personal goals included mental health challenges and motivation issues, with discrimination and inequality identified as major societal concerns by young Australians.',
 'Loneliness activates the same neural pathways as physical pain. Persistent loneliness increases cortisol, impairs sleep, and reduces immune function. In the school context, a lonely student is less likely to seek help from teachers, less likely to participate in class, and more likely to disengage from school entirely.',
 '[{"title":"Help-Seeking","text":"Lonely students are significantly less likely to approach teachers or school counsellors when struggling."},{"title":"Classroom Participation","text":"Social anxiety and distress dramatically reduce verbal participation and collaborative learning."},{"title":"Retention","text":"Loneliness is a direct predictor of school dropout, especially in secondary school."},{"title":"Physical Health","text":"Chronic loneliness is linked to poor sleep, poor diet, and reduced physical activity."}]'::jsonb,
 '["Rural and remote youth","Recently migrated students","Students with disabilities","Year 9–10 students (peak loneliness years)","LGBTQ+ youth"]'::jsonb,
 '["Mission Australia Youth Survey 2024","AIHW Children''s Mental Health Overview","Productivity Commission RoGS 2026 — engagement indicators"]'::jsonb);

-- Add remaining 12 issues in next batch to avoid query size limits
