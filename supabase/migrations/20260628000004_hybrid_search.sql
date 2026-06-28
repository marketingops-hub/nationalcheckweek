-- Hybrid retrieval: blend vector similarity with Postgres full-text so exact
-- tokens embeddings handle poorly (names, acronyms, "ABS 2023", "ICSEA",
-- percentages) are matched too. Results are fused with Reciprocal Rank Fusion
-- (rank-based, so the two arms' incomparable score scales don't matter).
--
-- Idempotent. The tsvector is a STORED generated column, so it backfills for
-- existing rows at ALTER time and stays current automatically.

alter table vault_chunks
  add column if not exists content_tsv tsvector
  generated always as (to_tsvector('english', content)) stored;

create index if not exists vault_chunks_tsv_idx on vault_chunks using gin(content_tsv);

create or replace function hybrid_match_vault_chunks(
  query_embedding  vector(1536),
  query_text       text,
  match_k          int   default 12,
  pool             int   default 40,   -- candidates pulled per arm before fusing
  rrf_k            int   default 60,   -- RRF damping constant
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
  with vec as (
    select c.id as chunk_id,
           row_number() over (order by c.embedding <=> query_embedding) as rnk,
           1 - (c.embedding <=> query_embedding) as sim
    from vault_chunks c
    join vault_documents d on d.id = c.document_id
    where d.status = 'ready'
      and c.embedding is not null
      and (category_filter is null or d.category = category_filter)
    order by c.embedding <=> query_embedding
    limit pool
  ),
  kw as (
    select c.id as chunk_id,
           row_number() over (order by ts_rank(c.content_tsv, q) desc) as rnk
    from vault_chunks c
    join vault_documents d on d.id = c.document_id,
         websearch_to_tsquery('english', coalesce(query_text, '')) q
    where d.status = 'ready'
      and c.content_tsv @@ q
      and (category_filter is null or d.category = category_filter)
    order by ts_rank(c.content_tsv, q) desc
    limit pool
  ),
  fused as (
    select coalesce(vec.chunk_id, kw.chunk_id) as chunk_id,
           coalesce(1.0 / (rrf_k + vec.rnk), 0) + coalesce(1.0 / (rrf_k + kw.rnk), 0) as score,
           vec.sim as sim
    from vec
    full outer join kw on vec.chunk_id = kw.chunk_id
  )
  select c.id, c.document_id, d.title, d.source, d.kind, c.page, c.heading, c.content,
         coalesce(f.sim, 0)::float as similarity
  from fused f
  join vault_chunks c on c.id = f.chunk_id
  join vault_documents d on d.id = c.document_id
  order by f.score desc
  limit match_k;
$$;

comment on function hybrid_match_vault_chunks is
  'Hybrid vector + full-text retrieval over vault_chunks, fused with Reciprocal Rank Fusion. Returns chunk_page + chunk_heading like match_vault_chunks.';
