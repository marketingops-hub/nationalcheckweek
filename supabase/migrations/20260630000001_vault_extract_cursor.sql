-- Resumable PDF extraction watermark.
--
-- The vault indexer now extracts large PDFs in page ranges across multiple
-- edge-function invocations (so a single invocation never has to parse +
-- extract a whole large document inside the ~150s wall-clock ceiling). This
-- column records how far extraction has committed so a fresh invocation can
-- resume instead of restarting.
--
-- Value = highest page number (1-based) whose chunks are committed. 0 = not
-- started. Only meaningful while status = 'extracting'.

alter table vault_documents
  add column if not exists extract_cursor int not null default 0;

comment on column vault_documents.extract_cursor is
  'Resumable PDF extraction watermark: highest 1-based page whose chunks are committed. 0 = not started. Meaningful only while status = extracting.';
