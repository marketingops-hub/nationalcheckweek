import { createClient } from "@supabase/supabase-js";

const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Use the management API to run raw SQL
const res = await fetch("https://api.supabase.com/v1/projects/qxcdeyvfeipyfojpxosh/database/query", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${SERVICE_KEY}`,
  },
  body: JSON.stringify({
    query: `
      create table if not exists api_keys (
        id         uuid primary key default gen_random_uuid(),
        label      text not null,
        provider   text not null default 'openai',
        key_value  text not null,
        is_active  boolean not null default true,
        created_at timestamptz default now(),
        updated_at timestamptz default now()
      );
      alter table api_keys enable row level security;
      do $$ begin
        if not exists (select 1 from pg_policies where tablename='api_keys' and policyname='Auth read api_keys') then
          create policy "Auth read api_keys" on api_keys for select using (auth.role() = 'authenticated');
        end if;
        if not exists (select 1 from pg_policies where tablename='api_keys' and policyname='Auth write api_keys') then
          create policy "Auth write api_keys" on api_keys for all using (auth.role() = 'authenticated');
        end if;
      end $$;
    `
  }),
});

const text = await res.text();
console.log("Management API:", res.status, text.slice(0, 200));

// Now insert the OpenAI key via REST
const sb = createClient(
  "https://qxcdeyvfeipyfojpxosh.supabase.co",
  SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Wait a moment for schema cache to refresh
await new Promise(r => setTimeout(r, 2000));

const OPENAI_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_KEY) {
  console.log("Set OPENAI_API_KEY env var to seed a key, or add keys via the admin UI.");
  process.exit(0);
}

const { error } = await sb.from("api_keys").insert({
  label: "OpenAI Production",
  provider: "openai",
  key_value: OPENAI_KEY,
  is_active: true,
});

if (error) {
  console.log("Insert error:", error.message, "- You can add keys via the admin UI once the table is created.");
} else {
  console.log("✅ OpenAI key seeded into api_keys table.");
}
