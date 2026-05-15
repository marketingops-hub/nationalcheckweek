# Vault RAG

Document library that the Content Creator AI reads as its source of truth.
Supports PDF, DOCX, TXT, pasted text and URL crawls. Every input is extracted,
chunked (~800 tokens with 120-token overlap) and embedded with OpenAI
`text-embedding-3-small`. Retrieval uses pgvector cosine similarity via the
`match_vault_chunks` RPC.

## Architecture

```
  /admin/vault/upload      ─┐
  (PDF / DOCX / TXT /       │
   paste / URL)             │
                            ▼
           ┌─────────────────────────────────────────┐
           │  POST /api/admin/vault/documents        │
           │    1. Store file in Storage (bucket:    │
           │       'vault') if applicable            │
           │    2. Insert vault_documents            │
           │       (status='pending')                │
           │    3. Fire-and-forget POST to           │
           │       vault-indexer edge fn             │
           └─────────────┬───────────────────────────┘
                         │
                         ▼
           ┌─────────────────────────────────────────┐
           │  Edge fn: vault-indexer                 │
           │    extracting → chunking → embedding    │
           │      → ready | failed                   │
           └─────────────────────────────────────────┘

                         │
                         ▼          (at query time)
           ┌─────────────────────────────────────────┐
           │  Content Creator edge fn                │
           │    embed(query) → match_vault_chunks()  │
           │    → top-k chunks by cosine similarity  │
           └─────────────────────────────────────────┘
```

## Tables

| Table | Purpose |
|---|---|
| `vault_documents`    | One row per ingested item. Pipeline state machine + metadata. |
| `vault_chunks`       | Token-sized slices of a document with an `embedding vector(1536)`. HNSW index. |

### Document state machine

```
pending → extracting → chunking → embedding → ready
                                           ↘ failed (any stage)
```

Any failure inside the edge function resets `status` to 'failed' and writes a
readable message into `status_error`. The admin can hit Re-index to retry.

## Storage

Bucket `vault` (private, 25 MB limit) holds the raw files. File path format:
`docs/<uuid>-<filename>`. Created by the migration.

## Retrieval

`match_vault_chunks(embedding, k=12, min_sim=0.25, category=null)` returns
the top-k chunks by cosine similarity, only from `status='ready'` documents.
Called directly by the Content Creator edge function.

If the embedding call fails or returns 0 results, the retriever falls back
to keyword scoring over the legacy `vault_content` table — keeps the pipeline
alive during the rollout window.

## Files

| Path | Purpose |
|---|---|
| `supabase/migrations/20260420000002_vault_rag.sql` | Tables + RPC + HNSW index + data migration |
| `supabase/functions/vault-indexer/`                | Edge fn: extract / chunk / embed |
| `src/app/api/admin/vault/documents/`               | Next.js API (GET/POST list, GET/PATCH/DELETE, reindex) |
| `src/app/admin/vault/upload/page.tsx`              | Drop files + paste + URL tabs |
| `src/app/admin/vault/sources/page.tsx`             | Document library grid |
| `src/app/admin/vault/sources/[id]/page.tsx`        | Document detail with chunk preview |
| `src/lib/vault/types.ts` / `schemas.ts` / `client.ts` | Shared types + Zod + adminFetch wrapper |
| `supabase/functions/content-creator/vault.ts`      | Retriever (embeddings + fallback) |

## Environment secrets

Set via Supabase dashboard → Edge Functions → Secrets:

```
OPENAI_API_KEY       # embeddings + content gen
ANTHROPIC_API_KEY    # content gen + verification
FIRECRAWL_API_KEY    # only needed for URL ingestion
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are auto-injected.

## Deployment

```bash
# 1. Apply the migration (tables, RPC, bucket, pgvector extension)
supabase db push      # or paste 20260420000002_vault_rag.sql into the SQL editor

# 2. Deploy the edge functions
supabase functions deploy vault-indexer
supabase functions deploy content-creator

# 3. Push the Next.js app
git push origin main
```

## Deploy costs (rough)

text-embedding-3-small is ~$0.02 / 1 M tokens. A 30-page PDF averages ~15k
tokens → ~$0.0003 per indexed document. A full brief embedding at retrieval
is ~50 tokens → $0.000001 per Content Creator call. Negligible at this scale.

## Limits + tunables

| Constant | Where | Default | Notes |
|---|---|---|---|
| `MAX_TOKENS`        | `chunk.ts` | 800  | Per-chunk target token count |
| `OVERLAP_TOKENS`    | `chunk.ts` | 120  | Overlap between neighbours |
| `MAX_FILE_BYTES`    | `schemas.ts` | 25 MB | Per-file upload ceiling |
| `MAX_FILES_PER_REQ` | `schemas.ts` | 10  | Per multipart request |
| `MIN_SIMILARITY`    | `content-creator/vault.ts` | 0.22 | Cosine threshold |
| `DEFAULT_LIMIT`     | `content-creator/vault.ts` | 12 | Top-k chunks per retrieval |
| `vaultUploadLimiter` | `documents/route.ts` | 100 / hr | Per admin |

## Rollout checklist

- [ ] `20260420000002_vault_rag.sql` applied in Supabase
- [ ] `vault-indexer` edge function deployed
- [ ] `content-creator` edge function redeployed with new retriever
- [ ] `FIRECRAWL_API_KEY` secret confirmed present in edge-function env
- [ ] Test upload of a small PDF → reaches `status='ready'` within ~30s
- [ ] Test paste of 1–2 paragraphs → `status='ready'` within ~5s
- [ ] Test URL crawl → `status='ready'` within ~20s
- [ ] Brief in Content Creator returns chunk-level citations in the verification panel

## Known limitations

- **No OCR.** Scanned / image-only PDFs fail extraction. Would need Tesseract.
- **Single embedding model.** Changing to a different dimension requires a full re-embed.
- **No versioning.** Re-index wipes old chunks; prior versions aren't archived.
- **Keyword fallback remains on `vault_content`.** Will be dropped in a follow-up migration once the new path is confirmed.
- **No dedup.** Uploading the same file twice creates two documents.
