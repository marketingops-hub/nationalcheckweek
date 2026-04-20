# Content Creator

Admin-only section at `/admin/content-creator` that produces **social posts,
blog posts and newsletters** grounded in the Vault as the single source of
truth.

Every draft flows through four stages:

```
    ┌───────┐      ┌──────────────┐      ┌─────────┐      ┌──────────┐
    │ Idea  │ ───▶ │ Approved     │ ───▶ │ Draft   │ ───▶ │ Verified │
    │       │      │ idea         │      │         │      │          │
    └───────┘      └──────────────┘      └─────────┘      └──────────┘
     OpenAI         user approves       OpenAI writes      Anthropic
   proposes N          one idea      → Anthropic improves  cross-checks
    ideas                                                 every claim
                                                         against Vault
```

Only verified content leaves the admin (as copy/download) — nothing is
auto-published.

---

## File map

| Area | Path | Purpose |
|---|---|---|
| Migration  | `supabase/migrations/20260420000001_content_drafts.sql` | Single table driving the pipeline |
| Edge fn    | `supabase/functions/content-creator/*`                   | Deno handler: stages `generate_ideas · generate · verify` |
| API routes | `src/app/api/admin/content-creator/*`                     | Next.js proxies + status guards |
| Client lib | `src/lib/content-creator/*`                               | Types, zod schemas, platform config, adminFetch client |
| UI         | `src/app/admin/content-creator/*`                         | Dashboard · new brief · draft detail |
| Tests      | `src/lib/content-creator/__tests__/*`                     | Vitest for schemas + transitions |

## Environment variables

Edge function requires:

```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
ANTHROPIC_API_KEY
```

Set them via the Supabase dashboard (Project Settings → Edge Functions → Secrets).

## Deploy

```bash
# 1. run the migration
supabase db push                # or paste the SQL into the Supabase SQL editor

# 2. deploy the edge function
supabase functions deploy content-creator

# 3. deploy the Next.js app as usual (Vercel / Netlify / self-host)
```

## Vault as source of truth

- **Generation** pulls the most relevant `vault_content` rows (keyword + category match) and pastes them into the prompt as an authoritative facts block.
- **Verification** extracts every factual claim from the draft and asks Claude to map each one onto a vault entry. A draft reaches `verified` only if there are **zero flagged claims**.
- Swap the keyword matcher in `supabase/functions/content-creator/vault.ts` for a pgvector similarity search once the vault grows past ~1000 rows.

## Per-type rules (enforced at DB level via CHECK constraint)

| Type         | Title     | Platform field | Char guidance |
|--------------|-----------|----------------|---------------|
| `social`     | **null**  | required       | per platform (see `platforms.ts`) |
| `blog`       | required  | null           | 600–900 words |
| `newsletter` | required  | null           | 300–500 words, title = subject line |

## State machine (mirrored in `schemas.ts#ALLOWED_TRANSITIONS`)

```
idea          → approved_idea | archived
approved_idea → generating    | archived
generating    → draft         | rejected
draft         → verifying     | archived
verifying     → verified      | rejected
verified      → draft         | archived   (unlock path; demotes on edit)
rejected      → draft         | archived
archived      → (terminal)
```

## Tests

```bash
npx vitest run src/lib/content-creator
```

## Rate limiting

The generation + verification endpoints are the only expensive calls. They
already inherit the global Upstash rate limits applied by `requireAdmin`.
Consider a narrower per-endpoint cap (e.g. 20 generations / admin / hour)
if cost becomes an issue — add it to `route.ts` before the `callEdge` call.

## Known limitations

- Keyword-based RAG only (pgvector migration planned).
- Single unified admin — no multi-user roles (audit_log records who did what).
- No draft versioning: editing a verified draft demotes it to `draft`; the
  prior version is not archived.
- No auto-publish — this is deliberate per product decision.
