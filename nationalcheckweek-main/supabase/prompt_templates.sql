-- ============================================================
-- Prompt Templates — per-section AI prompts for State & Area pages
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

create table if not exists prompt_templates (
  id           uuid primary key default gen_random_uuid(),
  page_type    text not null check (page_type in ('state', 'area')),
  section_key  text not null,
  label        text not null,
  prompt       text not null,
  model        text not null default 'gpt-4o',
  updated_at   timestamptz default now(),
  constraint prompt_templates_unique unique (page_type, section_key)
);

alter table prompt_templates enable row level security;
create policy "Public read prompt_templates"    on prompt_templates for select using (true);
create policy "Auth insert prompt_templates"    on prompt_templates for insert with check (auth.role() = 'authenticated');
create policy "Auth update prompt_templates"    on prompt_templates for update using (auth.role() = 'authenticated');
create policy "Auth delete prompt_templates"    on prompt_templates for delete using (auth.role() = 'authenticated');

create trigger prompt_templates_updated_at
  before update on prompt_templates
  for each row execute function set_updated_at();

-- ============================================================
-- Seed: STATE page prompts
-- Variable: {{state_name}}
-- ============================================================

insert into prompt_templates (page_type, section_key, label, prompt, model) values

('state', 'subtitle',
 'State — Subtitle',
$$You are writing a short subtitle for an Australian state wellbeing data page.

State: {{state_name}}

Write a single sentence (max 18 words) that describes the key student wellbeing challenges facing {{state_name}} schools. It should be factual, specific to the state, and suitable for a public-facing data website. Return plain text only — no quotes, no markdown.$$,
'gpt-4o'),

('state', 'issues',
 'State — Priority Issues (JSON)',
$$You are a student wellbeing data analyst writing content for an Australian education data website.

State: {{state_name}}

Using approved Australian data sources only, identify the 3–5 most significant student wellbeing challenges in {{state_name}} schools.

Return a JSON array with this exact structure — no markdown, no prose, just raw JSON:
[
  {
    "name": "Issue name (e.g. Anxiety & Stress)",
    "badge": "badge-critical" | "badge-high" | "badge-notable",
    "stat": "A specific Australian statistic (e.g. 1 in 4 students)",
    "desc": "2–3 sentences describing this issue in {{state_name}} with reference to state-level data."
  }
]

Badge severity guide:
- badge-critical: affects >25% of students or has direct risk-to-life implications
- badge-high: significant prevalence 10–25%, or strongly impacts learning outcomes
- badge-notable: emerging or regionally notable issue

Cite only real, verifiable Australian data. Do not invent statistics.$$,
'gpt-4o'),

('state', 'seo_title',
 'State — SEO Title',
$$Write an SEO title tag for an Australian student wellbeing data page about {{state_name}}.

Requirements:
- Max 60 characters
- Include "{{state_name}}" and a relevant keyword (e.g. "student wellbeing", "school mental health")
- Do not include the brand name
- Return plain text only$$,
'gpt-4o'),

('state', 'seo_desc',
 'State — SEO Meta Description',
$$Write an SEO meta description for an Australian student wellbeing data page about {{state_name}}.

Requirements:
- 140–155 characters
- Mention {{state_name}}, student wellbeing, and a specific issue if possible
- Should encourage click-through
- Return plain text only$$,
'gpt-4o')

on conflict (page_type, section_key) do nothing;

-- ============================================================
-- Seed: AREA / CITY page prompts
-- Variable: {{city_name}}, {{state_name}}
-- ============================================================

insert into prompt_templates (page_type, section_key, label, prompt, model) values

('area', 'overview',
 'City/Area — Overview',
$$You are writing a hero overview paragraph for an Australian city/area student wellbeing page.

City/Area: {{city_name}}
State: {{state_name}}

Write 2–3 sentences (max 60 words total) describing the student wellbeing landscape in {{city_name}}, {{state_name}}. Be specific to the local context where possible. This appears directly under the city name as the hero subtitle. Return plain text only — no markdown.$$,
'gpt-4o'),

('area', 'issues',
 'City/Area — Priority Issues (JSON)',
$$You are a student wellbeing data analyst writing content for an Australian education data website.

City/Area: {{city_name}}
State: {{state_name}}

Using approved Australian data sources, identify the 3–5 most significant student wellbeing issues in {{city_name}}.

Return a JSON array — no markdown, no prose, just raw JSON:
[
  {
    "title": "Issue name",
    "severity": "critical" | "high" | "notable",
    "stat": "A specific local or state-level Australian statistic",
    "desc": "2–3 sentences about this issue in {{city_name}} with data reference."
  }
]

Severity guide:
- critical: immediate risk or >25% prevalence
- high: significant 10–25% or strong impact on learning
- notable: emerging or locally relevant

Only cite real, verifiable Australian data.$$,
'gpt-4o'),

('area', 'prevention',
 'City/Area — Prevention Insight',
$$You are writing a "Prevention Insight" callout for a student wellbeing page about {{city_name}}, {{state_name}}.

Write 2–4 sentences (max 80 words) explaining how early data-led measurement of student emotional wellbeing can prevent crises in {{city_name}} schools. Reference the specific challenges of the area where relevant. The tone is authoritative but accessible — for school principals and educators. Return plain text only.$$,
'gpt-4o'),

('area', 'key_stats',
 'City/Area — Key Stats (JSON)',
$$You are writing key statistics for a student wellbeing page about {{city_name}}, {{state_name}}.

Return a JSON array of 2–3 local or state-level statistics relevant to student wellbeing. Format:
[
  { "num": "e.g. 1 in 5", "label": "students experience anxiety" },
  { "num": "e.g. 34%", "label": "report low school engagement" }
]

Use only real, verifiable Australian data. Return raw JSON only — no markdown.$$,
'gpt-4o'),

('area', 'seo_title',
 'City/Area — SEO Title',
$$Write an SEO title tag for an Australian student wellbeing data page about {{city_name}}, {{state_name}}.

Requirements:
- Max 60 characters
- Include "{{city_name}}" and a relevant keyword
- Return plain text only$$,
'gpt-4o'),

('area', 'seo_desc',
 'City/Area — SEO Meta Description',
$$Write an SEO meta description for an Australian student wellbeing data page about {{city_name}}, {{state_name}}.

Requirements:
- 140–155 characters
- Mention {{city_name}}, {{state_name}}, and student wellbeing
- Return plain text only$$,
'gpt-4o')

on conflict (page_type, section_key) do nothing;
