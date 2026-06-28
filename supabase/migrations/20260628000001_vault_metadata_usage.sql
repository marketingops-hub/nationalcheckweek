-- Vault hygiene + observability batch.
--
--  #6 extraction metadata: page_count / byte_size / file_hash on documents.
--  #7 duplicate detection: file_hash (+ index) so re-uploads can be caught.
-- #13 embedding provenance: model + dims per chunk, for selective re-embeds.
-- #14 usage tracking: use_count / last_used_at on documents, incremented when
--     a source is actually cited in a generation.
--
-- All additive + idempotent. Existing rows default to NULL / 0.

alter table vault_documents add column if not exists page_count   int;
alter table vault_documents add column if not exists byte_size    bigint;
alter table vault_documents add column if not exists file_hash    text;   -- sha-256 of source bytes / content
alter table vault_documents add column if not exists use_count    int not null default 0;
alter table vault_documents add column if not exists last_used_at timestamptz;

comment on column vault_documents.file_hash    is 'sha-256 of the source bytes (files) or content (paste). Used to detect duplicate uploads.';
comment on column vault_documents.use_count    is 'How many generations have cited this source.';
comment on column vault_documents.last_used_at is 'Last time a generation cited this source.';

-- Fast duplicate lookup on upload.
create index if not exists vault_documents_file_hash_idx on vault_documents(file_hash) where file_hash is not null;

alter table vault_chunks add column if not exists embedding_model text;
alter table vault_chunks add column if not exists embedding_dims  int;

comment on column vault_chunks.embedding_model is 'Embedding model used for this chunk, e.g. text-embedding-3-small.';

-- Bump usage counters for the documents cited in a generation. Called by the
-- content-creator-generate edge function with the distinct cited document ids.
create or replace function increment_vault_usage(doc_ids uuid[])
returns void
language sql
as $$
  update vault_documents
  set use_count    = coalesce(use_count, 0) + 1,
      last_used_at = now()
  where id = any(doc_ids);
$$;

comment on function increment_vault_usage is
  'Increment use_count + set last_used_at for the given vault_documents (cited sources).';
