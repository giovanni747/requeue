-- Add the missing image_public_id column to rooms table
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS image_public_id TEXT;
