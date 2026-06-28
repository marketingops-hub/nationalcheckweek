-- Richer source references for vault documents.
--
-- The content pipeline cites sources as "[Source N] {title} — {source}", where
-- `source` was often just a filename. These columns let a source carry a
-- proper human reference, a canonical public URL to link to, and an optional
-- page / locator, so citations read like real references.
--
-- All nullable + idempotent. Existing rows keep working (citations fall back
-- to title + source as before).

alter table vault_documents add column if not exists reference  text;  -- e.g. "AIHW. Australia's youth: mental health. 2024"
alter table vault_documents add column if not exists source_url text;  -- canonical public link for the citation
alter table vault_documents add column if not exists page_ref   text;  -- optional locator, e.g. "p. 14" or "Table 3"

comment on column vault_documents.reference  is 'Human-facing citation/reference for this source; preferred over title in rendered Sources lists.';
comment on column vault_documents.source_url is 'Canonical public URL the citation links to. Falls back to source when it is itself a URL.';
comment on column vault_documents.page_ref   is 'Optional page or locator shown alongside the citation (e.g. "p. 14").';
