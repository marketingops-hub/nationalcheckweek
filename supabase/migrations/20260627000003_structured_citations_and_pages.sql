-- Structured citations + automatic per-chunk page numbers.
--
-- 1. Structured reference fields on the document (author / publisher / year)
--    so citations can be composed as a formal reference instead of just a
--    title. The existing `reference` column stays as an optional override.
-- 2. A `page` on each chunk so PDF citations can show "p. N" for the exact
--    page a fact came from. Populated by the indexer; NULL for non-PDF
--    sources and for chunks indexed before this change (re-index to fill).
--
-- Idempotent.

alter table vault_documents add column if not exists author    text;
alter table vault_documents add column if not exists publisher text;
alter table vault_documents add column if not exists year      text;

comment on column vault_documents.author    is 'Author / organisation for the formal citation, e.g. "AIHW".';
comment on column vault_documents.publisher is 'Publisher for the formal citation.';
comment on column vault_documents.year       is 'Publication year (text, allows "n.d.").';

alter table vault_chunks add column if not exists page int;
comment on column vault_chunks.page is 'Source page (1-based) this chunk came from. PDFs only; NULL otherwise / until re-indexed.';

-- match_vault_chunks must now also return the chunk page. Changing the
-- RETURNS TABLE shape requires dropping the old function first.
drop function if exists match_vault_chunks(vector, integer, double precision, text);

create or replace function match_vault_chunks(
  query_embedding  vector(1536),
  match_k          int   default 12,
  min_similarity   float default 0.25,
  category_filter  text  default null
)
returns table (
  chunk_id         uuid,
  document_id      uuid,
  document_title   text,
  document_source  text,
  document_kind    text,
  chunk_page       int,
  content          text,
  similarity       float
)
language sql stable
as $$
  select
    c.id        as chunk_id,
    c.document_id,
    d.title     as document_title,
    d.source    as document_source,
    d.kind      as document_kind,
    c.page      as chunk_page,
    c.content,
    1 - (c.embedding <=> query_embedding) as similarity
  from vault_chunks c
  join vault_documents d on d.id = c.document_id
  where d.status = 'ready'
    and c.embedding is not null
    and (category_filter is null or d.category = category_filter)
    and 1 - (c.embedding <=> query_embedding) >= min_similarity
  order by c.embedding <=> query_embedding
  limit match_k;
$$;

comment on function match_vault_chunks is
  'Cosine-similarity search over vault_chunks (now returns chunk_page). Used by the content-creator edge function for RAG retrieval.';
