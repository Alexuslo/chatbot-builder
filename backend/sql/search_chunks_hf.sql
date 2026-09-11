-- Drop existing function
DROP FUNCTION IF EXISTS search_chunks(vector, integer, uuid);
DROP FUNCTION IF EXISTS search_chunks(vector, integer, uuid);

-- Create search function with 384 dimensions (HuggingFace all-MiniLM-L6-v2)
CREATE OR REPLACE FUNCTION search_chunks(
  query_embedding vector(384),
  match_count int DEFAULT 5,
  doc_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  document_id uuid,
  content text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  IF doc_id IS NULL THEN
    RETURN QUERY
    SELECT c.id, c.document_id, c.content, 1 - (c.embedding::vector <=> query_embedding) AS similarity
    FROM chunks c
    ORDER BY c.embedding::vector <=> query_embedding
    LIMIT match_count;
  ELSE
    RETURN QUERY
    SELECT c.id, c.document_id, c.content, 1 - (c.embedding::vector <=> query_embedding) AS similarity
    FROM chunks c
    WHERE c.document_id = doc_id
    ORDER BY c.embedding::vector <=> query_embedding
    LIMIT match_count;
  END IF;
END;
$$;
