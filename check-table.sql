-- Check the structure of the existing rooms table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'rooms' 
ORDER BY ordinal_position;

-- Also check if there are any existing records
SELECT COUNT(*) as total_rooms FROM rooms;
