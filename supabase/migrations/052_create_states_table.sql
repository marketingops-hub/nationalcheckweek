-- Create states table for Australian states/territories
CREATE TABLE IF NOT EXISTS public.states (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  slug        text NOT NULL UNIQUE,
  code        text NOT NULL,
  color       text NOT NULL DEFAULT '#29B8E8',
  icon        text NOT NULL DEFAULT '🗺️',
  description text,
  published   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- RLS: public read, admin write
ALTER TABLE public.states ENABLE ROW LEVEL SECURITY;

CREATE POLICY "states_public_read"  ON public.states FOR SELECT USING (published = true);
CREATE POLICY "states_service_all"  ON public.states USING (auth.role() = 'service_role');

-- Seed all 8 Australian states/territories
INSERT INTO public.states (name, slug, code, color, icon, description, published) VALUES
  ('New South Wales',           'new-south-wales',            'NSW', '#0032A0', '🔵', 'Australia''s most populous state with over 8 million students and young people.', true),
  ('Victoria',                  'victoria',                   'VIC', '#003087', '🟣', 'Home to Melbourne and a diverse range of regional communities and schools.', true),
  ('Queensland',                'queensland',                 'QLD', '#800020', '🔴', 'A vast state spanning tropical, regional, and urban communities across the north-east.', true),
  ('Western Australia',         'western-australia',          'WA',  '#F5A623', '🟡', 'Australia''s largest state with unique challenges in remote and regional wellbeing.', true),
  ('South Australia',           'south-australia',            'SA',  '#E31837', '🔴', 'Known for its strong school communities and focus on student mental health programs.', true),
  ('Tasmania',                  'tasmania',                   'TAS', '#007B5E', '🟢', 'Island state with close-knit school communities and strong rural wellbeing focus.', true),
  ('Northern Territory',        'northern-territory',         'NT',  '#DC4405', '🟠', 'Unique challenges in remote and Indigenous community wellbeing and education.', true),
  ('Australian Capital Territory', 'australian-capital-territory', 'ACT', '#00843D', '🟢', 'National capital with a highly educated population and strong policy focus on youth wellbeing.', true)
ON CONFLICT (slug) DO NOTHING;
