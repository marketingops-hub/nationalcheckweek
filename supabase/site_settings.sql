-- Site settings key-value store
create table if not exists site_settings (
  key   text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);

-- Seed default rows
insert into site_settings (key, value) values
  ('site_name',         'Schools Wellbeing Australia'),
  ('contact_email',     ''),
  ('maintenance_mode',  'false'),
  ('footer_tagline',    'Supporting student wellbeing across Australia.')
on conflict (key) do nothing;
