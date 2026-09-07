-- Read-only performance migration: adds trigram support + GIN index for
-- ILIKE recipe-name search. No rows are inserted, updated, or deleted.
-- CREATE INDEX CONCURRENTLY does not block reads/writes on "recipes".
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX CONCURRENTLY IF NOT EXISTS recipes_recipeName_trgm_idx
  ON "recipes" USING gin ("recipeName" gin_trgm_ops);
