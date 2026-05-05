-- Add type column to distinguish palette saves from image saves
ALTER TABLE palettes ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'palette';

-- Add effects column to store applied effects metadata
ALTER TABLE palettes ADD COLUMN IF NOT EXISTS effects JSONB DEFAULT NULL;

-- Make colors nullable (image saves won't have colors)
ALTER TABLE palettes ALTER COLUMN colors DROP NOT NULL;

-- Index on type for filtered queries
CREATE INDEX IF NOT EXISTS palettes_type_idx ON palettes(type);
