CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS clearnotice_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  name text NOT NULL,
  file_type text NOT NULL,
  source_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS clearnotice_documents_session_created_idx
  ON clearnotice_documents (session_id, created_at DESC);

CREATE TABLE IF NOT EXISTS clearnotice_document_chunks (
  document_id uuid NOT NULL REFERENCES clearnotice_documents(id) ON DELETE CASCADE,
  session_id uuid NOT NULL,
  chunk_id text NOT NULL,
  chunk_text text NOT NULL,
  page_number integer,
  search_vector tsvector GENERATED ALWAYS AS (to_tsvector('simple', chunk_text)) STORED,
  PRIMARY KEY (document_id, chunk_id)
);

CREATE INDEX IF NOT EXISTS clearnotice_document_chunks_search_idx
  ON clearnotice_document_chunks USING gin (search_vector);
CREATE INDEX IF NOT EXISTS clearnotice_document_chunks_session_idx
  ON clearnotice_document_chunks (session_id, document_id);
