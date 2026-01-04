-- Create palettes table for storing user color palettes
CREATE TABLE IF NOT EXISTS palettes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    colors JSONB NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS palettes_user_id_idx ON palettes(user_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS palettes_created_at_idx ON palettes(created_at DESC);

-- Enable Row Level Security
ALTER TABLE palettes ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can view their own palettes
CREATE POLICY "Users can view their own palettes"
    ON palettes FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own palettes
CREATE POLICY "Users can insert their own palettes"
    ON palettes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own palettes
CREATE POLICY "Users can update their own palettes"
    ON palettes FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own palettes
CREATE POLICY "Users can delete their own palettes"
    ON palettes FOR DELETE
    USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_palettes_updated_at
    BEFORE UPDATE ON palettes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
