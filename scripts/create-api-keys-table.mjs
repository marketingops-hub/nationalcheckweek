import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  "https://qxcdeyvfeipyfojpxosh.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const sql = `
  create table if not exists api_keys (
    id         uuid primary key default gen_random_uuid(),
    label      text not null,
    provider   text not null default 'openai',
    key_value  text not null,
    is_active  boolean not null default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
  );

  do $$ begin
    if not exists (select 1 from pg_policy where polname = 'Auth read api_keys') then
      alter table api_keys enable row level security;
      create policy "Auth read api_keys"  on api_keys for select using (auth.role() = 'authenticated');
      create policy "Auth write api_keys" on api_keys for all    using (auth.role() = 'authenticated');
    end if;
  end $$;
`;

// Supabase JS client doesn't expose raw SQL — use the REST API directly
const res = await fetch("https://qxcdeyvfeipyfojpxosh.supabase.co/rest/v1/rpc/exec_sql", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY,
    "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
  },
  body: JSON.stringify({ sql }),
});

if (!res.ok) {
  // Table creation via SQL editor is needed — check if table already exists
  const check = await sb.from("api_keys").select("id").limit(1);
  if (check.error && check.error.code === "42P01") {
    console.log("❌ api_keys table does not exist. Please run supabase/api_keys.sql in the Supabase SQL editor.");
  } else {
    console.log("✅ api_keys table already exists.");
  }
} else {
  console.log("✅ api_keys table created.");
}
