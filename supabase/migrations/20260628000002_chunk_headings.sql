-- Section/heading path per chunk (#12).
--
-- Stores the nearest preceding heading on each chunk so retrieval context and
-- citations can reference the section ("§3.2 Methodology"), and recreates the
-- search function to return it alongside the page.
--
-- Idempotent.

alter table vault_chunks add column if not exists heading text;
comment on column vault_chunks.heading is 'Nearest preceding heading/section for this chunk (markdown or numbered sections). NULL when none detected / pre-heading rows.';

-- Recreate match_vault_chunks to also return chunk_heading (keeps chunk_page).
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
  chunk_heading    text,
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
    c.heading   as chunk_heading,
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
  'Cosine-similarity search over vault_chunks (returns chunk_page + chunk_heading). Used by content-creator retrieval.';
